#!/usr/bin/env node
/**
 * Run Evaluations on Real Datasets
 * 
 * Orchestrates evaluations using the newly downloaded datasets:
 * - WebUI Dataset (visual UI understanding)
 * - WCAG Test Cases (accessibility)
 */

import { loadWebUIDataset } from '../utils/load-webui-dataset.mjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { runWebUIEvaluation } from './run-webui-evaluation.mjs';

const WCAG_DATASET_FILE = join(process.cwd(), 'evaluation', 'datasets', 'wcag-ground-truth.json');

async function main() {
  console.log('🚀 Running Dataset-Based Evaluations\n');
  console.log('Using real downloaded datasets:\n');
  
  // 1. WebUI Dataset Evaluation
  console.log('1️⃣  WebUI Dataset Evaluation');
  console.log('   📊 Visual UI understanding with ~7000 real web screenshots\n');
  
  try {
    const webuiDataset = await loadWebUIDataset({ limit: 100, cache: true });
    if (webuiDataset && webuiDataset.samples && webuiDataset.samples.length > 0) {
      console.log(`   ✅ Loaded ${webuiDataset.samples.length} samples`);
      console.log(`   🎯 Running evaluation on sample subset...\n`);
      
      // Run evaluation on a smaller subset for demonstration
      await runWebUIEvaluation({ limit: 10, provider: null });
    } else {
      console.log('   ⚠️  WebUI dataset not available');
      console.log('   💡 Run: node evaluation/utils/convert-webui-dataset.mjs first\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // 2. WCAG Test Cases
  console.log('\n2️⃣  WCAG Test Cases');
  console.log('   ♿ Accessibility test cases from W3C\n');
  
  if (existsSync(WCAG_DATASET_FILE)) {
    try {
      const wcagDataset = JSON.parse(readFileSync(WCAG_DATASET_FILE, 'utf-8'));
      console.log(`   ✅ Loaded ${wcagDataset.totalTestCases || 0} test case references`);
      console.log(`   📝 Dataset: ${wcagDataset.name}`);
      console.log(`   📄 Source: ${wcagDataset.source}`);
      console.log(`   💡 Use these test cases for accessibility validation\n`);
    } catch (error) {
      console.log(`   ⚠️  Error loading WCAG dataset: ${error.message}\n`);
    }
  } else {
    console.log('   ⚠️  WCAG dataset not parsed');
    console.log('   💡 Run: node evaluation/utils/parse-wcag-testcases.mjs first\n');
  }
  
  console.log('✅ Dataset evaluations completed!');
  console.log('\n📋 Available Utilities:');
  console.log('   📊 Analysis:');
  console.log('      - node evaluation/utils/analyze-webui-results.mjs');
  console.log('      - node evaluation/utils/compare-with-ground-truth.mjs');
  console.log('   ✅ Ground Truth Validation:');
  console.log('      - node evaluation/utils/validate-with-ground-truth.mjs [limit]');
  console.log('      - node evaluation/utils/accessibility-tree-validator.mjs [limit]');
  console.log('      - node evaluation/utils/enhanced-webui-evaluation.mjs [limit]');
  console.log('      - node evaluation/utils/element-detection-accuracy.mjs [limit]');
  console.log('      - node evaluation/utils/comprehensive-ground-truth-evaluation.mjs [limit]');
  console.log('   🎯 Research-Based Evaluations (WebUI Paper):');
  console.log('      - node evaluation/utils/iou-element-detection.mjs [limit] (IoU metrics)');
  console.log('      - node evaluation/utils/screen-classification-evaluation.mjs [limit]');
  console.log('      - node evaluation/utils/style-contrast-validation.mjs [limit]');
  console.log('      - node evaluation/utils/multi-viewport-validation.mjs [limit]');
  console.log('      - node evaluation/utils/element-type-validation.mjs [limit]');
  console.log('      - node evaluation/utils/comprehensive-webui-research-evaluation.mjs [limit]');
  console.log('   📝 Generation:');
  console.log('      - node evaluation/utils/create-webui-specs.mjs [limit]');
  console.log('   ⚡ Benchmarking:');
  console.log('      - node evaluation/utils/webui-benchmark.mjs [limit]');
  console.log('   🔍 Exploration:');
  console.log('      - node evaluation/utils/explore-webui-dataset.mjs [command]');
  console.log('   📈 Evaluation:');
  console.log('      - node evaluation/runners/run-webui-evaluation.mjs [limit]');
  console.log('      - node evaluation/runners/run-comprehensive-webui-evaluation.mjs [limit]');
  console.log('\n💡 Next Steps:');
  console.log('   1. Validate with ground truth: node evaluation/utils/validate-with-ground-truth.mjs');
  console.log('   2. Compare evaluation methods: node evaluation/utils/enhanced-webui-evaluation.mjs');
  console.log('   3. Use accessibility trees: node evaluation/utils/accessibility-tree-validator.mjs');
}

main().catch(console.error);

