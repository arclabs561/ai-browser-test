/**
 * Health check endpoint
 * 
 * GET /api/health
 */

import { createConfig } from '../src/index.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = createConfig();
    
    return res.status(200).json({
      status: 'ok',
      enabled: config.enabled,
      provider: config.provider,
      version: '0.1.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
}

