#!/usr/bin/env node
/**
 * Run Evaluation on WebUI Dataset
 * 
 * Evaluates our validation methods on real WebUI dataset samples.
 */

import { loadWebUIDataset, getRandomWebUISamples, filterWebUISamples } from '../utils/load-webui-dataset.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Evaluate a single WebUI sample
 */
async function evaluateSample(sample, options = {}) {
  const { provider = null } = options;
  
  if (!existsSync(sample.screenshot)) {
    return {
      sampleId: sample.id,
      url: sample.url,
      status: 'skipped',
      reason: 'screenshot_not_found'
    };
  }
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    return {
      sampleId: sample.id,
      url: sample.url,
      status: 'skipped',
      reason: 'vllm_disabled'
    };
  }
  
  try {
    const prompt = `Evaluate this webpage screenshot for:
- Visual design and layout quality
- Accessibility (WCAG compliance)
- Usability and clarity
- Overall quality score (0-10)`;
    
    // Use validateScreenshot with file path directly
    const { validateScreenshot } = await import('../../src/index.mjs');
    const result = await validateScreenshot(
      sample.screenshot,
      prompt,
      {
        provider: config.provider,
        apiKey: config.apiKey,
        testType: 'evaluation',
        viewport: sample.viewport
      }
    );
    
    return {
      sampleId: sample.id,
      url: sample.url,
      viewport: sample.viewport,
      status: 'success',
      score: result.score,
      reasoning: result.reasoning,
      issues: result.issues || [],
      hasGroundTruth: {
        accessibilityTree: sample.groundTruth?.hasAccessibilityTree || false,
        boundingBoxes: sample.groundTruth?.hasBoundingBoxes || false,
        styles: sample.groundTruth?.hasStyles || false
      }
    };
  } catch (error) {
    return {
      sampleId: sample.id,
      url: sample.url,
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Main evaluation function
 */
async function runWebUIEvaluation(options = {}) {
  const {
    limit = 50,
    provider = null,
    random = false,
    filter = null
  } = options;
  
  console.log('🚀 WebUI Dataset Evaluation\n');
  
  // Check configuration
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled. Set GEMINI_API_KEY or OPENAI_API_KEY');
    process.exit(1);
  }
  
  console.log(`✅ Using provider: ${config.provider}`);
  console.log(`📊 Sample limit: ${limit}`);
  console.log(`🎲 Random sampling: ${random}\n`);
  
  // Load dataset
  console.log('📦 Loading WebUI dataset...');
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  
  if (!dataset || !dataset.samples || dataset.samples.length === 0) {
    console.error('❌ No samples found in WebUI dataset');
    console.error('   Run: node evaluation/utils/convert-webui-dataset.mjs first');
    process.exit(1);
  }
  
  console.log(`✅ Loaded ${dataset.samples.length} samples\n`);
  
  // Select samples
  let samples;
  if (random) {
    samples = getRandomWebUISamples(dataset, limit);
    console.log(`🎲 Selected ${samples.length} random samples\n`);
  } else if (filter) {
    samples = filterWebUISamples(dataset, filter).slice(0, limit);
    console.log(`🔍 Filtered to ${samples.length} samples\n`);
  } else {
    samples = dataset.samples.slice(0, limit);
    console.log(`📊 Using first ${samples.length} samples\n`);
  }
  
  // Evaluate samples
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    console.log(`[${i + 1}/${samples.length}] Evaluating: ${sample.id} (${sample.url || 'no URL'})`);
    
    const result = await evaluateSample(sample, { provider: config.provider });
    results.push(result);
    
    if (result.status === 'success') {
      successCount++;
      console.log(`   ✅ Score: ${result.score}/10`);
    } else if (result.status === 'skipped') {
      skippedCount++;
      console.log(`   ⏭️  Skipped: ${result.reason}`);
    } else {
      errorCount++;
      console.log(`   ❌ Error: ${result.error}`);
    }
  }
  
  // Summary
  const summary = {
    timestamp: new Date().toISOString(),
    dataset: dataset.name,
    totalSamples: samples.length,
    success: successCount,
    errors: errorCount,
    skipped: skippedCount,
    averageScore: results
      .filter(r => r.status === 'success' && r.score !== undefined)
      .reduce((sum, r) => sum + r.score, 0) / successCount || 0,
    results
  };
  
  console.log('\n📊 Evaluation Summary:');
  console.log(`   Total: ${summary.totalSamples}`);
  console.log(`   Success: ${summary.success}`);
  console.log(`   Errors: ${summary.errors}`);
  console.log(`   Skipped: ${summary.skipped}`);
  console.log(`   Average Score: ${summary.averageScore.toFixed(2)}/10`);
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `webui-evaluation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify(summary, null, 2));
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return summary;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 50;
  const provider = process.argv[3] || null;
  runWebUIEvaluation({ limit, provider }).catch(console.error);
}

export { runWebUIEvaluation, evaluateSample };

