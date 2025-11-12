#!/usr/bin/env node
/**
 * Comprehensive Evaluation Rig
 * 
 * Runs ai-visual-test against multiple datasets with standard metrics.
 * Compares results against ground truth and other methods.
 */

import { validateScreenshot, createConfig } from '../../src/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import {
  calculateAllMetrics,
  formatMetrics
} from './metrics.mjs';
import {
  loadWebUIDataset,
  loadTabularAccessibilityDataset,
  createSyntheticDataset,
  loadCustomDataset,
  DATASETS_DIR,
  CACHE_DIR
} from './dataset-loaders.mjs';

const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results');

// Ensure results directory exists
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Evaluate a single sample from a dataset
 */
async function evaluateSample(sample, options = {}) {
  const {
    provider = null,
    prompt = null,
    context = {}
  } = options;
  
  // If sample has screenshot path, use it
  if (sample.screenshot && existsSync(sample.screenshot)) {
    const defaultPrompt = `Evaluate this screenshot for quality, accessibility, and design. 
Check for:
- Visual design and aesthetics
- Functional correctness
- Usability and clarity
- Accessibility compliance (WCAG)
- Color contrast
- Keyboard navigation
- Screen reader compatibility

Provide a score from 0-10 and list any issues found.`;
    
    const result = await validateScreenshot(
      sample.screenshot,
      prompt || defaultPrompt,
      {
        ...context,
        testType: sample.testType || 'evaluation',
        viewport: sample.metadata?.viewport || { width: 1280, height: 720 }
      }
    );
    
    return {
      sampleId: sample.id,
      success: true,
      result: {
        score: result.score,
        issues: result.issues || [],
        assessment: result.assessment,
        reasoning: result.reasoning
      },
      groundTruth: sample.groundTruth || {},
      metadata: {
        provider: result.provider,
        cached: result.cached,
        responseTime: result.responseTime,
        estimatedCost: result.estimatedCost
      }
    };
  }
  
  return {
    sampleId: sample.id,
    success: false,
    error: 'Screenshot not found or not provided'
  };
}

/**
 * Run evaluation on a dataset
 */
async function evaluateDataset(dataset, options = {}) {
  const {
    limit = null,
    provider = null,
    prompt = null,
    context = {}
  } = options;
  
  console.log(`\n🔬 Evaluating dataset: ${dataset.name}`);
  console.log(`   Samples: ${dataset.samples.length}`);
  
  if (limit) {
    console.log(`   Limiting to: ${limit} samples`);
  }
  
  const samples = limit ? dataset.samples.slice(0, limit) : dataset.samples;
  const results = [];
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    console.log(`   [${i + 1}/${samples.length}] Evaluating: ${sample.id || sample.name || 'sample'}`);
    
    try {
      const evaluation = await evaluateSample(sample, { provider, prompt, context });
      results.push(evaluation);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        sampleId: sample.id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Compare against other methods (placeholder for future integration)
 */
async function compareWithOtherMethods(evaluations, dataset) {
  console.log('\n📊 Comparing with other methods...');
  
  // This would integrate with:
  // - Other VLLM providers
  // - Traditional accessibility tools (axe, WAVE, etc.)
  // - Human evaluators
  // - Other research implementations
  
  const comparison = {
    methods: [],
    agreement: {},
    differences: []
  };
  
  // Placeholder for future comparisons
  console.log('   (Comparison with other methods not yet implemented)');
  
  return comparison;
}

/**
 * Main evaluation function
 */
async function runComprehensiveEvaluation(options = {}) {
  const {
    datasets = ['synthetic'], // 'webui', 'tabular', 'synthetic', 'custom'
    limit = null,
    provider = null,
    outputFile = null
  } = options;
  
  console.log('🚀 Starting Comprehensive Evaluation');
  console.log(`📊 Datasets: ${datasets.join(', ')}`);
  console.log(`📁 Results directory: ${RESULTS_DIR}`);
  
  // Check configuration
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled. Set GEMINI_API_KEY or OPENAI_API_KEY');
    process.exit(1);
  }
  
  console.log(`✅ Using provider: ${config.provider}`);
  
  const allResults = [];
  const datasetResults = {};
  
  // Load and evaluate each dataset
  for (const datasetName of datasets) {
    let dataset;
    let results;
    
    try {
      switch (datasetName) {
        case 'webui':
          dataset = await loadWebUIDataset({ limit, cache: true });
          if (dataset && dataset.samples) {
            results = await evaluateDataset(dataset, { limit, provider });
          } else {
            console.log('   ⚠️  WebUI dataset not available (requires manual download)');
            results = [];
          }
          break;
          
        case 'tabular':
          dataset = await loadTabularAccessibilityDataset({ limit, cache: true });
          if (dataset && dataset.samples) {
            results = await evaluateDataset(dataset, { limit, provider });
          } else {
            console.log('   ⚠️  Tabular Accessibility dataset not available (requires manual download)');
            results = [];
          }
          break;
          
        case 'synthetic':
          // Create synthetic dataset from known websites
          const websites = [
            { name: 'GitHub', url: 'https://github.com', expectedScore: { min: 7, max: 10 }, expectedIssues: [] },
            { name: 'MDN', url: 'https://developer.mozilla.org', expectedScore: { min: 8, max: 10 }, expectedIssues: [] },
            { name: 'W3C', url: 'https://www.w3.org', expectedScore: { min: 8, max: 10 }, expectedIssues: [] }
          ];
          dataset = await createSyntheticDataset(websites, { usePlaywright: true });
          results = await evaluateDataset(dataset, { limit, provider });
          break;
          
        case 'custom':
          const customPath = join(DATASETS_DIR, 'custom-dataset.json');
          if (existsSync(customPath)) {
            dataset = loadCustomDataset(customPath);
            results = await evaluateDataset(dataset, { limit, provider });
          } else {
            console.log(`   ⚠️  Custom dataset not found: ${customPath}`);
            results = [];
          }
          break;
          
        default:
          console.log(`   ⚠️  Unknown dataset: ${datasetName}`);
          results = [];
      }
      
      datasetResults[datasetName] = {
        dataset: dataset?.name || datasetName,
        results,
        metrics: calculateAllMetrics(results.filter(r => r.success))
      };
      
      allResults.push(...results);
      
    } catch (error) {
      console.error(`❌ Error evaluating ${datasetName}:`, error.message);
      datasetResults[datasetName] = {
        dataset: datasetName,
        results: [],
        error: error.message
      };
    }
  }
  
  // Calculate overall metrics
  const overallMetrics = calculateAllMetrics(allResults.filter(r => r.success));
  
  // Compare with other methods
  const comparisons = await compareWithOtherMethods(allResults, datasetResults);
  
  // Prepare final results
  const finalResults = {
    timestamp: new Date().toISOString(),
    config: {
      provider: config.provider,
      datasets: datasets,
      limit: limit
    },
    datasets: datasetResults,
    overall: {
      totalSamples: allResults.length,
      successful: allResults.filter(r => r.success).length,
      failed: allResults.filter(r => !r.success).length,
      metrics: overallMetrics
    },
    comparisons: comparisons
  };
  
  // Save results
  const resultsFile = outputFile || join(RESULTS_DIR, `comprehensive-evaluation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify(finalResults, null, 2));
  
  // Print summary
  console.log('\n📊 Evaluation Summary');
  console.log(`   Total samples: ${allResults.length}`);
  console.log(`   Successful: ${allResults.filter(r => r.success).length}`);
  console.log(`   Failed: ${allResults.filter(r => !r.success).length}`);
  console.log('\n' + formatMetrics(overallMetrics));
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  
  return finalResults;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    datasets: args.includes('--webui') ? ['webui'] : 
                args.includes('--tabular') ? ['tabular'] :
                args.includes('--all') ? ['synthetic', 'webui', 'tabular'] :
                ['synthetic'],
    limit: args.find(a => a.startsWith('--limit='))?.split('=')[1] || null,
    provider: args.find(a => a.startsWith('--provider='))?.split('=')[1] || null
  };
  
  if (options.limit) {
    options.limit = parseInt(options.limit);
  }
  
  runComprehensiveEvaluation(options).catch(console.error);
}

export { runComprehensiveEvaluation, evaluateDataset, evaluateSample };

