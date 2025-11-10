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

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, prompt, context = {} } = req.body;

    // Validate input
    if (!image) {
      return res.status(400).json({ error: 'Missing image (base64 encoded)' });
    }
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
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
    console.error('[VLLM API] Error:', error);
    return res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
}

