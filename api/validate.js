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

// Security limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PROMPT_LENGTH = 5000;
const MAX_CONTEXT_SIZE = 10000;

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Save to temporary file
    const tempPath = join(tmpdir(), `vllm-validate-${Date.now()}.png`);
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
    const sanitizedError = error instanceof Error 
      ? 'Validation failed' 
      : String(error);
    
    return res.status(500).json({
      error: sanitizedError
    });
  }
}

