/**
 * VLLM Cache
 * 
 * Provides persistent caching for VLLM API calls to reduce costs and improve performance.
 * Uses file-based storage for cache persistence across test runs.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default cache directory (can be overridden)
let CACHE_DIR = null;
let CACHE_FILE = null;
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cache instance
let cacheInstance = null;

/**
 * Initialize cache with directory
 */
export function initCache(cacheDir) {
  CACHE_DIR = cacheDir || join(__dirname, '..', '..', '..', 'test-results', 'vllm-cache');
  CACHE_FILE = join(CACHE_DIR, 'cache.json');
  
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  cacheInstance = null; // Reset instance to reload
}

/**
 * Generate cache key from image path, prompt, and context
 */
export function generateCacheKey(imagePath, prompt, context = {}) {
  const keyData = {
    imagePath,
    prompt: prompt.substring(0, 1000), // Limit prompt length for key (increased from 500)
    testType: context.testType || '',
    frame: context.frame || '',
    score: context.score || '',
    viewport: context.viewport ? JSON.stringify(context.viewport) : '', // Include viewport
    gameState: context.gameState ? JSON.stringify(context.gameState).substring(0, 500) : '' // Include game state
  };
  
  const keyString = JSON.stringify(keyData);
  return createHash('sha256').update(keyString).digest('hex');
}

/**
 * Load cache from file
 */
function loadCache() {
  if (!CACHE_FILE || !existsSync(CACHE_FILE)) {
    return new Map();
  }
  
  try {
    const cacheData = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    const cache = new Map();
    const now = Date.now();
    
    // Filter out expired entries
    for (const [key, value] of Object.entries(cacheData)) {
      if (value.timestamp && (now - value.timestamp) < MAX_CACHE_AGE) {
        cache.set(key, value.data);
      }
    }
    
    return cache;
  } catch (error) {
    console.warn(`[VLLM Cache] Failed to load cache: ${error.message}`);
    return new Map();
  }
}

/**
 * Save cache to file
 */
function saveCache(cache) {
  if (!CACHE_FILE) return;
  
  try {
    const cacheData = {};
    const now = Date.now();
    
    for (const [key, value] of cache.entries()) {
      cacheData[key] = {
        data: value,
        timestamp: now
      };
    }
    
    writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
  } catch (error) {
    console.warn(`[VLLM Cache] Failed to save cache: ${error.message}`);
  }
}

/**
 * Get cache instance (singleton)
 */
function getCache() {
  if (!cacheInstance) {
    if (!CACHE_DIR) {
      initCache(); // Initialize with default directory
    }
    cacheInstance = loadCache();
  }
  return cacheInstance;
}

/**
 * Get cached result
 */
export function getCached(imagePath, prompt, context = {}) {
  const cache = getCache();
  const key = generateCacheKey(imagePath, prompt, context);
  return cache.get(key) || null;
}

/**
 * Set cached result
 */
export function setCached(imagePath, prompt, context, result) {
  const cache = getCache();
  const key = generateCacheKey(imagePath, prompt, context);
  cache.set(key, result);
  saveCache(cache);
}

/**
 * Clear cache
 */
export function clearCache() {
  const cache = getCache();
  cache.clear();
  saveCache(cache);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const cache = getCache();
  return {
    size: cache.size,
    maxAge: MAX_CACHE_AGE,
    cacheFile: CACHE_FILE
  };
}

