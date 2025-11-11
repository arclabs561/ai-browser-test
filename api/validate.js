/**
 * Vercel Serverless Function for VLLM Screenshot Validation
 * 
 * POST /api/validate
 * 
 * Body:
 * {
 *   "image": "base64-encoded-image",
 *   "prompt": "Evaluation prompt",
 *   "context": { ... }
 * }
 * 
 * Returns:
 * {
 *   "enabled": boolean,
 *   "provider": string,
 *   "score": number|null,
 *   "issues": string[],
 *   "assessment": string|null,
 *   "reasoning": string,
 *   "estimatedCost": object|null,
 *   "responseTime": number
 * }
 */

import { validateScreenshot, createConfig } from '../src/index.mjs';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

// Security limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PROMPT_LENGTH = 5000;
const MAX_CONTEXT_SIZE = 10000;

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10);
const rateLimitStore = new Map(); // In-memory store (use Redis in production)

// Authentication configuration
const API_KEY = process.env.API_KEY || process.env.VLLM_API_KEY || null;
// Default to requiring auth if API key is set (more secure)
// Set REQUIRE_AUTH=false explicitly to disable
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false' && API_KEY !== null;

/**
 * Simple rate limiter (in-memory)
 * For production, use Redis or a dedicated rate limiting service
 */
function checkRateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean up old entries
  for (const [key, timestamps] of rateLimitStore.entries()) {
    const recent = timestamps.filter(ts => ts > windowStart);
    if (recent.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, recent);
    }
  }
  
  // Check current identifier
  const timestamps = rateLimitStore.get(identifier) || [];
  const recent = timestamps.filter(ts => ts > windowStart);
  
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Math.min(...recent) + RATE_LIMIT_WINDOW
    };
  }
  
  // Add current request
  recent.push(now);
  rateLimitStore.set(identifier, recent);
  
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - recent.length,
    resetAt: now + RATE_LIMIT_WINDOW
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req) {
  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const ip = forwarded?.split(',')[0] || realIp || req.socket?.remoteAddress || 'unknown';
  
  // If API key is provided, use it as identifier (more accurate)
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  return apiKey || ip;
}

/**
 * Check authentication
 */
function checkAuth(req) {
  if (!REQUIRE_AUTH || !API_KEY) {
    return { authenticated: true };
  }
  
  const providedKey = req.headers['x-api-key'] || 
                     req.headers['authorization']?.replace('Bearer ', '') ||
                     req.body?.apiKey;
  
  if (!providedKey) {
    return { authenticated: false, error: 'Authentication required. Provide API key via X-API-Key header or Authorization: Bearer <key>' };
  }
  
  if (providedKey !== API_KEY) {
    return { authenticated: false, error: 'Invalid API key' };
  }
  
  return { authenticated: true };
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check authentication
  const authResult = checkAuth(req);
  if (!authResult.authenticated) {
    return res.status(401).json({ error: authResult.error });
  }
  
  // Check rate limit
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId);
  if (!rateLimit.allowed) {
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    });
  }
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
  res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());

  try {
    const { image, prompt, context = {} } = req.body;

    // Validate input presence
    if (!image) {
      return res.status(400).json({ error: 'Missing image (base64 encoded)' });
    }
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // Validate input size
    if (typeof image !== 'string' || image.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: 'Image too large or invalid format' });
    }
    if (typeof prompt !== 'string' || prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({ error: 'Prompt too long' });
    }
    if (context && typeof context === 'object') {
      const contextSize = JSON.stringify(context).length;
      if (contextSize > MAX_CONTEXT_SIZE) {
        return res.status(400).json({ error: 'Context too large' });
      }
    }

    // Decode base64 image
    let imageBuffer;
    try {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return res.status(400).json({ error: 'Invalid base64 image' });
    }

    // Save to temporary file with secure random name (prevents race conditions and information disclosure)
    const randomSuffix = randomBytes(16).toString('hex');
    const tempPath = join(tmpdir(), `vllm-validate-${randomSuffix}.png`);
    writeFileSync(tempPath, imageBuffer);

    try {
      // Validate screenshot
      const result = await validateScreenshot(tempPath, prompt, context);

      // Clean up temp file
      unlinkSync(tempPath);

      // Return result
      return res.status(200).json(result);
    } catch (error) {
      // Clean up temp file on error
      try {
        unlinkSync(tempPath);
      } catch {}

      throw error;
    }
  } catch (error) {
    // Log full error for debugging (server-side only)
    console.error('[VLLM API] Error:', error);
    
    // Return sanitized error to client (don't leak internal details)
    // Never expose: file paths, API keys, internal structure, stack traces
    const sanitizedError = error instanceof Error 
      ? 'Validation failed. Please check your input and try again.' 
      : 'Validation failed';
    
    return res.status(500).json({
      error: sanitizedError
    });
  }
}

