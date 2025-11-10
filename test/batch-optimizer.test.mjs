/**
 * Tests for batch-optimizer.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { BatchOptimizer } from '../src/batch-optimizer.mjs';

test('BatchOptimizer - constructor with default options', () => {
  const optimizer = new BatchOptimizer();
  
  assert.ok(optimizer);
  assert.strictEqual(optimizer.maxConcurrency, 5);
  assert.strictEqual(optimizer.batchSize, 3);
  assert.strictEqual(optimizer.cache !== null, true);
});

test('BatchOptimizer - constructor with custom options', () => {
  const optimizer = new BatchOptimizer({
    maxConcurrency: 10,
    batchSize: 5,
    cacheEnabled: false
  });
  
  assert.strictEqual(optimizer.maxConcurrency, 10);
  assert.strictEqual(optimizer.batchSize, 5);
  assert.strictEqual(optimizer.cache, null);
});

test('BatchOptimizer - _getCacheKey generates consistent keys', () => {
  const optimizer = new BatchOptimizer();
  const key1 = optimizer._getCacheKey('test.png', 'prompt', { test: 'value' });
  const key2 = optimizer._getCacheKey('test.png', 'prompt', { test: 'value' });
  
  assert.strictEqual(key1, key2);
});

test('BatchOptimizer - _getCacheKey different inputs generate different keys', () => {
  const optimizer = new BatchOptimizer();
  const key1 = optimizer._getCacheKey('test1.png', 'prompt', {});
  const key2 = optimizer._getCacheKey('test2.png', 'prompt', {});
  
  assert.notStrictEqual(key1, key2);
});

test('BatchOptimizer - clearCache clears cache', () => {
  const optimizer = new BatchOptimizer({ cacheEnabled: true });
  
  // Set cache manually (since we can't easily test batchValidate without mocking)
  optimizer.cache.set('test-key', { score: 8 });
  
  optimizer.clearCache();
  
  assert.strictEqual(optimizer.cache.size, 0);
});

test('BatchOptimizer - getCacheStats returns statistics', () => {
  const optimizer = new BatchOptimizer({ cacheEnabled: true });
  
  const stats = optimizer.getCacheStats();
  
  assert.ok(stats);
  assert.strictEqual(typeof stats.cacheSize, 'number');
  assert.strictEqual(typeof stats.queueLength, 'number');
  assert.strictEqual(typeof stats.activeRequests, 'number');
  assert.strictEqual(stats.cacheSize, 0);
  assert.strictEqual(stats.queueLength, 0);
  assert.strictEqual(stats.activeRequests, 0);
});

test('BatchOptimizer - getCacheStats with cache disabled', () => {
  const optimizer = new BatchOptimizer({ cacheEnabled: false });
  
  const stats = optimizer.getCacheStats();
  
  assert.ok(stats);
  assert.strictEqual(stats.cacheSize, 0);
});

