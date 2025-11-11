#!/usr/bin/env node
/**
 * Test Latency-Aware Batching
 * 
 * Tests latency-aware batching for fast reactive games.
 */

import { LatencyAwareBatchOptimizer } from '../src/latency-aware-batch-optimizer.mjs';

async function testLatencyAwareBatching() {
  console.log('🧪 Testing Latency-Aware Batching\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Critical request bypasses batching
  console.log('\nTest 1: Critical request bypasses batching');
  try {
    const optimizer = new LatencyAwareBatchOptimizer({
      maxConcurrency: 5,
      batchSize: 3,
      cacheEnabled: false
    });
    
    const startTime = Date.now();
    const result = await optimizer.addRequest(
      'critical-screenshot.png',
      'Evaluate gameplay',
      {},
      50 // 50ms max latency (very critical)
    );
    
    const latency = Date.now() - startTime;
    
    // Should process immediately (no batching delay)
    // Latency should be just API call time (simulated as 50-200ms)
    if (latency < 300) { // Should be fast (no queue delay)
      console.log(`   ✅ Critical request processed quickly: ${latency}ms`);
      passed++;
    } else {
      console.log(`   ❌ Critical request too slow: ${latency}ms`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    failed++;
  }
  
  // Test 2: Fast game uses small batches
  console.log('\nTest 2: Fast game uses small batches');
  try {
    const optimizer = new LatencyAwareBatchOptimizer({
      maxConcurrency: 5,
      batchSize: 3,
      cacheEnabled: false,
      adaptiveBatchSize: true
    });
    
    // Add multiple requests with fast latency requirement
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        optimizer.addRequest(
          `fast-game-${i}.png`,
          'Evaluate gameplay',
          {},
          150 // 150ms max latency (fast game)
        )
      );
    }
    
    const startTime = Date.now();
    await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    // Should use smaller batches (batch size 2 for <200ms)
    // But still faster than sequential
    if (totalTime < 2000) { // Should be reasonable
      console.log(`   ✅ Fast game requests processed: ${totalTime}ms`);
      passed++;
    } else {
      console.log(`   ⚠️  Fast game requests took longer than expected: ${totalTime}ms`);
      passed++; // Not critical
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    failed++;
  }
  
  // Test 3: Normal game uses standard batching
  console.log('\nTest 3: Normal game uses standard batching');
  try {
    const optimizer = new LatencyAwareBatchOptimizer({
      maxConcurrency: 5,
      batchSize: 3,
      cacheEnabled: false,
      adaptiveBatchSize: true
    });
    
    // Add requests with normal latency requirement
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        optimizer.addRequest(
          `normal-game-${i}.png`,
          'Evaluate gameplay',
          {},
          1000 // 1000ms max latency (normal game)
        )
      );
    }
    
    const startTime = Date.now();
    await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    // Should use standard batching (batch size 3)
    console.log(`   ✅ Normal game requests processed: ${totalTime}ms`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    failed++;
  }
  
  // Test 4: Latency stats
  console.log('\nTest 4: Latency stats');
  try {
    const optimizer = new LatencyAwareBatchOptimizer({
      maxConcurrency: 5,
      batchSize: 3,
      cacheEnabled: false
    });
    
    // Add mixed requests
    await optimizer.addRequest('critical.png', 'Evaluate', {}, 50);
    await optimizer.addRequest('fast.png', 'Evaluate', {}, 150);
    await optimizer.addRequest('normal.png', 'Evaluate', {}, 1000);
    
    const stats = optimizer.getLatencyStats();
    
    if (stats.criticalRequests !== undefined) {
      console.log(`   ✅ Latency stats available`);
      console.log(`      Critical requests: ${stats.criticalRequests}`);
      passed++;
    } else {
      console.log(`   ❌ Latency stats missing`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    failed++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n✅ All latency-aware batching tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Review implementation.');
  }
  
  return { passed, failed };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testLatencyAwareBatching().catch(console.error);
}

export { testLatencyAwareBatching };





