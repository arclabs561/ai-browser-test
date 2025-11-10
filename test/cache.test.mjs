/**
 * Tests for cache.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { 
  initCache, 
  getCached, 
  setCached, 
  clearCache, 
  getCacheStats,
  generateCacheKey
} from '../src/cache.mjs';

const TEST_CACHE_DIR = join(tmpdir(), 'ai-browser-test-cache-test');

test.beforeEach(() => {
  // Clean up test cache directory
  if (existsSync(TEST_CACHE_DIR)) {
    try {
      const cacheFile = join(TEST_CACHE_DIR, 'cache.json');
      if (existsSync(cacheFile)) {
        unlinkSync(cacheFile);
      }
      rmdirSync(TEST_CACHE_DIR);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  mkdirSync(TEST_CACHE_DIR, { recursive: true });
  initCache(TEST_CACHE_DIR);
});

test.afterEach(() => {
  // Clean up test cache directory
  if (existsSync(TEST_CACHE_DIR)) {
    try {
      const cacheFile = join(TEST_CACHE_DIR, 'cache.json');
      if (existsSync(cacheFile)) {
        unlinkSync(cacheFile);
      }
      rmdirSync(TEST_CACHE_DIR);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
});

test('generateCacheKey - generates consistent keys', () => {
  const key1 = generateCacheKey('test.png', 'prompt', { testType: 'test' });
  const key2 = generateCacheKey('test.png', 'prompt', { testType: 'test' });
  
  assert.strictEqual(key1, key2);
  assert.strictEqual(typeof key1, 'string');
  assert.ok(key1.length > 0);
});

test('generateCacheKey - different inputs generate different keys', () => {
  const key1 = generateCacheKey('test1.png', 'prompt', { testType: 'test' });
  const key2 = generateCacheKey('test2.png', 'prompt', { testType: 'test' });
  
  assert.notStrictEqual(key1, key2);
});

test('setCached and getCached - basic caching', () => {
  const imagePath = 'test.png';
  const prompt = 'test prompt';
  const context = { testType: 'test' };
  const result = { score: 8, issues: [] };
  
  setCached(imagePath, prompt, context, result);
  const cached = getCached(imagePath, prompt, context);
  
  assert.ok(cached);
  assert.strictEqual(cached.score, 8);
  assert.deepStrictEqual(cached.issues, []);
});

test('getCached - returns null for non-existent cache', () => {
  const cached = getCached('nonexistent.png', 'prompt', {});
  
  assert.strictEqual(cached, null);
});

test('clearCache - clears all cached entries', () => {
  setCached('test1.png', 'prompt1', {}, { score: 1 });
  setCached('test2.png', 'prompt2', {}, { score: 2 });
  
  clearCache();
  
  const cached1 = getCached('test1.png', 'prompt1', {});
  const cached2 = getCached('test2.png', 'prompt2', {});
  
  assert.strictEqual(cached1, null);
  assert.strictEqual(cached2, null);
});

test('getCacheStats - returns cache statistics', () => {
  setCached('test1.png', 'prompt1', {}, { score: 1 });
  setCached('test2.png', 'prompt2', {}, { score: 2 });
  
  const stats = getCacheStats();
  
  assert.ok(stats);
  assert.strictEqual(typeof stats.size, 'number');
  assert.strictEqual(stats.size, 2);
  assert.ok(stats.maxAge);
  assert.ok(stats.cacheFile);
});

test('cache persistence - survives reinitialization', () => {
  setCached('test.png', 'prompt', {}, { score: 8 });
  
  // Reinitialize cache
  initCache(TEST_CACHE_DIR);
  
  const cached = getCached('test.png', 'prompt', {});
  assert.ok(cached);
  assert.strictEqual(cached.score, 8);
});

test('cache key includes viewport', () => {
  const key1 = generateCacheKey('test.png', 'prompt', { viewport: { width: 1280, height: 720 } });
  const key2 = generateCacheKey('test.png', 'prompt', { viewport: { width: 1920, height: 1080 } });
  
  assert.notStrictEqual(key1, key2);
});

test('cache key includes game state', () => {
  const key1 = generateCacheKey('test.png', 'prompt', { gameState: { score: 10 } });
  const key2 = generateCacheKey('test.png', 'prompt', { gameState: { score: 20 } });
  
  assert.notStrictEqual(key1, key2);
});
