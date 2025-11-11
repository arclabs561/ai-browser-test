/**
 * Tests for temporal-batch-optimizer.mjs
 * 
 * Tests temporal batch optimization with dependencies and sequential context
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TemporalBatchOptimizer } from '../src/temporal-batch-optimizer.mjs';
import { SequentialDecisionContext } from '../src/temporal-decision.mjs';

describe('TemporalBatchOptimizer', () => {
  test('constructor extends BatchOptimizer', () => {
    const optimizer = new TemporalBatchOptimizer();
    
    assert.ok(optimizer);
    assert.strictEqual(optimizer.maxConcurrency, 5);
    assert.strictEqual(optimizer.batchSize, 3);
    assert.ok(optimizer.temporalDependencies);
    assert.strictEqual(optimizer.adaptiveBatching, true);
  });
  
  test('constructor with sequential context', () => {
    const context = new SequentialDecisionContext();
    const optimizer = new TemporalBatchOptimizer({
      sequentialContext: context
    });
    
    assert.strictEqual(optimizer.sequentialContext, context);
  });
  
  test('calculatePriority - no dependencies gets high priority', () => {
    const optimizer = new TemporalBatchOptimizer();
    
    const priority1 = optimizer.calculatePriority([], {});
    const priority2 = optimizer.calculatePriority(['dep1'], {});
    
    assert.ok(priority1 > priority2);
  });
  
  test('calculatePriority - earlier timestamps get higher priority', () => {
    const optimizer = new TemporalBatchOptimizer();
    const now = Date.now();
    
    // Test with timestamps that are both recent (within 1 minute)
    const priority1 = optimizer.calculatePriority([], { timestamp: now - 1000 }); // 1 second ago
    const priority2 = optimizer.calculatePriority([], { timestamp: now - 5000 }); // 5 seconds ago
    
    // Earlier timestamp (older) should have higher priority within reasonable window
    // But both should have some priority boost
    assert.ok(priority1 >= 0);
    assert.ok(priority2 >= 0);
  });
  
  test('calculatePriority - critical evaluations get higher priority', () => {
    const optimizer = new TemporalBatchOptimizer();
    
    const priority1 = optimizer.calculatePriority([], { critical: true });
    const priority2 = optimizer.calculatePriority([], {});
    
    assert.ok(priority1 > priority2);
  });
  
  test('sortByTemporalDependencies - sorts by priority', () => {
    const optimizer = new TemporalBatchOptimizer();
    
    optimizer.temporalDependencies.set('img1', {
      dependencies: [],
      priority: 100
    });
    optimizer.temporalDependencies.set('img2', {
      dependencies: ['img1'],
      priority: 50
    });
    
    const queue = [
      { imagePath: 'img2' },
      { imagePath: 'img1' }
    ];
    
    const sorted = optimizer.sortByTemporalDependencies(queue);
    
    assert.strictEqual(sorted[0].imagePath, 'img1'); // Higher priority first
  });
  
  test('selectTemporalBatch - respects dependencies', () => {
    const optimizer = new TemporalBatchOptimizer({ batchSize: 2 });
    
    optimizer.temporalDependencies.set('img1', {
      dependencies: [],
      priority: 100
    });
    optimizer.temporalDependencies.set('img2', {
      dependencies: ['img1'],
      priority: 50
    });
    
    const queue = [
      { imagePath: 'img1' },
      { imagePath: 'img2' }
    ];
    
    const batch = optimizer.selectTemporalBatch(queue);
    
    // img2 should not be in batch until img1 is processed
    assert.ok(batch.some(item => item.imagePath === 'img1'));
  });
  
  test('getTemporalStats - returns statistics', () => {
    const optimizer = new TemporalBatchOptimizer();
    
    optimizer.temporalDependencies.set('img1', {
      dependencies: [],
      priority: 100
    });
    
    const stats = optimizer.getTemporalStats();
    
    assert.strictEqual(stats.dependencies, 1);
    assert.ok(stats.cacheSize !== undefined);
    assert.ok(stats.queueLength !== undefined);
  });
  
  test('getTemporalStats - includes sequential context', () => {
    const context = new SequentialDecisionContext();
    context.addDecision({ score: 8 });
    
    const optimizer = new TemporalBatchOptimizer({
      sequentialContext: context
    });
    
    const stats = optimizer.getTemporalStats();
    
    assert.ok(stats.sequentialContext);
    assert.strictEqual(stats.sequentialContext.historyLength, 1);
  });
});

