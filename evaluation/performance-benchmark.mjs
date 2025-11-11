#!/usr/bin/env node
/**
 * Performance Benchmark for Temporal Components
 * 
 * Measures performance of temporal decision-making components
 */

import {
  SequentialDecisionContext,
  aggregateMultiScale,
  humanPerceptionTime
} from '../src/temporal-decision.mjs';
import { TemporalBatchOptimizer } from '../src/temporal-batch-optimizer.mjs';

/**
 * Benchmark SequentialDecisionContext
 */
function benchmarkSequentialContext(iterations = 1000) {
  console.log(`📊 Benchmarking SequentialDecisionContext (${iterations} iterations)...`);
  
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    const context = new SequentialDecisionContext({ maxHistory: 10 });
    
    // Simulate 10 decisions
    for (let j = 0; j < 10; j++) {
      context.addDecision({
        score: 5 + Math.random() * 5,
        issues: ['issue1', 'issue2']
      });
    }
    
    // Test pattern identification
    context.identifyPatterns();
    
    // Test prompt adaptation
    context.adaptPrompt('Evaluate this screenshot', {});
  }
  
  const end = performance.now();
  const duration = end - start;
  const avgTime = duration / iterations;
  
  console.log(`  Total: ${duration.toFixed(2)}ms`);
  console.log(`  Average: ${avgTime.toFixed(3)}ms per iteration`);
  console.log(`  Throughput: ${(iterations / (duration / 1000)).toFixed(0)} ops/sec\n`);
  
  return { duration, avgTime, throughput: iterations / (duration / 1000) };
}

/**
 * Benchmark aggregateMultiScale
 */
function benchmarkMultiScale(iterations = 100) {
  console.log(`📊 Benchmarking aggregateMultiScale (${iterations} iterations)...`);
  
  const now = Date.now();
  const notes = Array.from({ length: 50 }, (_, i) => ({
    timestamp: now + i * 1000,
    elapsed: i * 1000,
    score: 5 + Math.random() * 5,
    observation: `Note ${i}`,
    salience: i % 3 === 0 ? 'high' : 'normal'
  }));
  
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    aggregateMultiScale(notes, { attentionWeights: true });
  }
  
  const end = performance.now();
  const duration = end - start;
  const avgTime = duration / iterations;
  
  console.log(`  Total: ${duration.toFixed(2)}ms`);
  console.log(`  Average: ${avgTime.toFixed(3)}ms per iteration`);
  console.log(`  Throughput: ${(iterations / (duration / 1000)).toFixed(0)} ops/sec\n`);
  
  return { duration, avgTime, throughput: iterations / (duration / 1000) };
}

/**
 * Benchmark humanPerceptionTime
 */
function benchmarkHumanPerceptionTime(iterations = 10000) {
  console.log(`📊 Benchmarking humanPerceptionTime (${iterations} iterations)...`);
  
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    humanPerceptionTime('reading', {
      contentLength: Math.random() * 2000,
      attentionLevel: ['focused', 'normal', 'distracted'][Math.floor(Math.random() * 3)],
      actionComplexity: ['simple', 'normal', 'complex'][Math.floor(Math.random() * 3)]
    });
  }
  
  const end = performance.now();
  const duration = end - start;
  const avgTime = duration / iterations;
  
  console.log(`  Total: ${duration.toFixed(2)}ms`);
  console.log(`  Average: ${avgTime.toFixed(6)}ms per call`);
  console.log(`  Throughput: ${(iterations / (duration / 1000)).toFixed(0)} calls/sec\n`);
  
  return { duration, avgTime, throughput: iterations / (duration / 1000) };
}

/**
 * Run all benchmarks
 */
function runPerformanceBenchmark() {
  console.log('🚀 Performance Benchmark for Temporal Components\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    benchmarks: {}
  };
  
  results.benchmarks.sequentialContext = benchmarkSequentialContext(1000);
  results.benchmarks.multiScale = benchmarkMultiScale(100);
  results.benchmarks.humanPerceptionTime = benchmarkHumanPerceptionTime(10000);
  
  // Summary
  console.log('📊 Summary\n');
  console.log('Component Performance:');
  Object.entries(results.benchmarks).forEach(([name, data]) => {
    console.log(`  ${name}: ${data.avgTime.toFixed(3)}ms avg, ${data.throughput.toFixed(0)} ops/sec`);
  });
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceBenchmark();
}

export { runPerformanceBenchmark };

