/**
 * VLLM Cache
 * 
 * Provides persistent caching for VLLM API calls to reduce costs and improve performance.
 * Uses file-based storage for cache persistence across test runs.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, normalize, resolve } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { CacheError, FileError } from './errors.mjs';
import { warn } from './logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default cache directory (can be overridden)
let CACHE_DIR = null;
let CACHE_FILE = null;
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 1000; // Maximum number of cache entries (LRU eviction)
const MAX_CACHE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB maximum cache file size

// Cache instance
let cacheInstance = null;
// Cache write lock to prevent race conditions
let cacheWriteLock = false;

/**
 * Initialize cache with directory
 * 
 * @param {string | undefined} [cacheDir] - Cache directory path, or undefined for default
 * @returns {void}
 */
export function initCache(cacheDir) {
  // SECURITY: Validate and normalize cache directory to prevent path traversal
  if (cacheDir) {
    const normalized = normalize(resolve(cacheDir));
    // Prevent path traversal
    if (normalized.includes('..')) {
      throw new CacheError('Invalid cache directory: path traversal detected', { cacheDir });
    }
    CACHE_DIR = normalized;
  } else {
    CACHE_DIR = join(__dirname, '..', '..', '..', 'test-results', 'vllm-cache');
  }
  CACHE_FILE = join(CACHE_DIR, 'cache.json');
  
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  cacheInstance = null; // Reset instance to reload
}

/**
 * Generate cache key from image path, prompt, and context
 * 
 * @param {string} imagePath - Path to image file
 * @param {string} prompt - Validation prompt
 * @param {import('./index.mjs').ValidationContext} [context={}] - Validation context
 * @returns {string} SHA-256 hash of cache key
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
    warn(`[VLLM Cache] Failed to load cache: ${error.message}`);
    return new Map();
  }
}

/**
 * Save cache to file with size limits and race condition protection
 */
function saveCache(cache) {
  if (!CACHE_FILE) return;
  
  // Prevent concurrent writes (simple lock mechanism)
  if (cacheWriteLock) {
    warn('[VLLM Cache] Cache write already in progress, skipping save');
    return;
  }
  
  cacheWriteLock = true;
  
  try {
    const cacheData = {};
    const now = Date.now();
    let totalSize = 0;
    
    // Convert to array and sort by timestamp (LRU: oldest first)
    const entries = Array.from(cache.entries())
      .map(([key, value]) => ({
        key,
        value,
        timestamp: now // All entries get current timestamp on save
      }))
      .sort((a, b) => {
        // Sort by access time if available, otherwise FIFO
        const aTime = a.value._lastAccessed || 0;
        const bTime = b.value._lastAccessed || 0;
        return aTime - bTime;
      });
    
    // Apply size limits (LRU eviction)
    const entriesToKeep = entries.slice(-MAX_CACHE_SIZE);
    
    for (const { key, value, timestamp } of entriesToKeep) {
      const entry = {
        data: value,
        timestamp
      };
      const entrySize = JSON.stringify(entry).length;
      
      // Check total size limit
      if (totalSize + entrySize > MAX_CACHE_SIZE_BYTES) {
        break; // Stop adding entries if we exceed size limit
      }
      
      cacheData[key] = entry;
      totalSize += entrySize;
    }
    
    // Update in-memory cache to match saved entries
    cache.clear();
    for (const [key, entry] of Object.entries(cacheData)) {
      cache.set(key, entry.data);
    }
    
    writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
  } catch (error) {
    warn(`[VLLM Cache] Failed to save cache: ${error.message}`);
  } finally {
    cacheWriteLock = false;
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
 * 
 * @param {string} imagePath - Path to image file
 * @param {string} prompt - Validation prompt
 * @param {import('./index.mjs').ValidationContext} [context={}] - Validation context
 * @returns {import('./index.mjs').ValidationResult | null} Cached result or null if not found
 */
export function getCached(imagePath, prompt, context = {}) {
  const cache = getCache();
  const key = generateCacheKey(imagePath, prompt, context);
  const cached = cache.get(key);
  
  if (cached) {
    // Update access time for LRU eviction
    cached._lastAccessed = Date.now();
  }
  
  return cached || null;
}

/**
 * Set cached result
 * 
 * @param {string} imagePath - Path to image file
 * @param {string} prompt - Validation prompt
 * @param {import('./index.mjs').ValidationContext} context - Validation context
 * @param {import('./index.mjs').ValidationResult} result - Validation result to cache
 * @returns {void}
 */
export function setCached(imagePath, prompt, context, result) {
  const cache = getCache();
  const key = generateCacheKey(imagePath, prompt, context);
  
  // Add access time for LRU eviction
  const resultWithMetadata = {
    ...result,
    _lastAccessed: Date.now()
  };
  
  cache.set(key, resultWithMetadata);
  
  // Check if cache exceeds size limit before saving
  if (cache.size > MAX_CACHE_SIZE) {
    // Trigger eviction by saving (which applies LRU)
    saveCache(cache);
  } else {
    saveCache(cache);
  }
}

/**
 * Clear cache
 * 
 * @returns {void}
 */
export function clearCache() {
  const cache = getCache();
  cache.clear();
  saveCache(cache);
}

/**
 * Get cache statistics
 * 
 * @returns {import('./index.mjs').CacheStats} Cache statistics
 */
export function getCacheStats() {
  const cache = getCache();
  return {
    size: cache.size,
    maxAge: MAX_CACHE_AGE,
    cacheFile: CACHE_FILE
  };
}

