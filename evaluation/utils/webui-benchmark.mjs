#!/usr/bin/env node
/**
 * WebUI Dataset Benchmark
 * 
 * Benchmarks validation performance and accuracy on WebUI dataset.
 */

import { loadWebUIDataset, getRandomWebUISamples } from './load-webui-dataset.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Run benchmark
 */
async function runBenchmark(options = {}) {
  const {
    limit = 30,
    provider = null
  } = options;
  
  console.log('⚡ WebUI Dataset Benchmark\n');
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  console.log(`Provider: ${config.provider}`);
  console.log(`Samples: ${limit}\n`);
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  const samples = getRandomWebUISamples(dataset, limit);
  
  const prompt = 'Evaluate this webpage screenshot for quality, accessibility, and design. Score 0-10.';
  
  const results = [];
  const timings = [];
  
  console.log('Running benchmark...\n');
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const startTime = Date.now();
    
    try {
      const result = await validateScreenshot(
        sample.screenshot,
        prompt,
        {
          provider: config.provider,
          apiKey: config.apiKey,
          testType: 'benchmark'
        }
      );
      
      const duration = Date.now() - startTime;
      timings.push(duration);
      
      results.push({
        sampleId: sample.id,
        success: true,
        score: result.score,
        duration,
        cached: result.cached || false
      });
      
      process.stdout.write(`[${i + 1}/${samples.length}] ${duration}ms ${result.cached ? '(cached)' : ''}\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        sampleId: sample.id,
        success: false,
        error: error.message,
        duration
      });
      process.stdout.write(`[${i + 1}/${samples.length}] Error: ${error.message}\n`);
    }
  }
  
  // Statistics
  const successful = results.filter(r => r.success);
  const cached = results.filter(r => r.cached);
  const timings_success = timings;
  
  const stats = {
    total: results.length,
    successful: successful.length,
    failed: results.length - successful.length,
    cached: cached.length,
    averageTime: timings_success.length > 0
      ? timings_success.reduce((a, b) => a + b, 0) / timings_success.length
      : 0,
    minTime: timings_success.length > 0 ? Math.min(...timings_success) : 0,
    maxTime: timings_success.length > 0 ? Math.max(...timings_success) : 0,
    averageScore: successful.length > 0
      ? successful.reduce((sum, r) => sum + r.score, 0) / successful.length
      : 0
  };
  
  console.log('\n📊 Benchmark Results:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Successful: ${stats.successful}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Cached: ${stats.cached}`);
  console.log(`   Average Time: ${stats.averageTime.toFixed(0)}ms`);
  console.log(`   Min Time: ${stats.minTime}ms`);
  console.log(`   Max Time: ${stats.maxTime}ms`);
  console.log(`   Average Score: ${stats.averageScore.toFixed(2)}/10`);
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `webui-benchmark-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    provider: config.provider,
    stats,
    results
  }, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return { stats, results };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 30;
  const provider = process.argv[3] || null;
  runBenchmark({ limit, provider }).catch(console.error);
}

export { runBenchmark };

