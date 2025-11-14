#!/usr/bin/env node
/**
 * Comprehensive Ground Truth Evaluation
 * 
 * Runs all ground truth validation methods and compares results.
 * Provides comprehensive analysis of VLLM accuracy using all available annotations.
 */

import { runGroundTruthValidation } from './validate-with-ground-truth.mjs';
import { runAccessibilityTreeValidation } from './accessibility-tree-validator.mjs';
import { runElementDetectionAccuracy } from './element-detection-accuracy.mjs';
import { compareEvaluationMethods } from './enhanced-webui-evaluation.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Run comprehensive evaluation
 */
async function runComprehensiveEvaluation(options = {}) {
  const { limit = 10, provider = null } = options;
  
  console.log('🔬 Comprehensive Ground Truth Evaluation\n');
  console.log('Running all validation methods and comparing results\n');
  console.log(`Samples: ${limit}\n`);
  
  const results = {
    timestamp: new Date().toISOString(),
    provider,
    limit,
    methods: {}
  };
  
  // 1. Ground Truth Validation
  console.log('1️⃣  Ground Truth Validation (VLLM claims vs actual counts)');
  try {
    const gtValidation = await runGroundTruthValidation({ limit, provider });
    results.methods.groundTruthValidation = {
      averageAccuracy: gtValidation.averageAccuracy,
      validated: gtValidation.results.filter(r => r.validation?.validated).length,
      total: gtValidation.results.length
    };
    console.log(`   ✅ Average Accuracy: ${(gtValidation.averageAccuracy * 100).toFixed(1)}%\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // 2. Accessibility Tree Validation
  console.log('2️⃣  Accessibility Tree Validation (programmatic + VLLM)');
  try {
    const axtreeValidation = await runAccessibilityTreeValidation({ limit, provider });
    results.methods.accessibilityTree = {
      withProgrammatic: axtreeValidation.results.filter(r => r.programmaticData).length,
      total: axtreeValidation.results.length
    };
    console.log(`   ✅ Completed\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // 3. Element Detection Accuracy
  console.log('3️⃣  Element Detection Accuracy (bounding boxes)');
  try {
    const elementDetection = await runElementDetectionAccuracy({ limit, provider });
    results.methods.elementDetection = {
      averageAccuracy: elementDetection.averageAccuracy,
      validated: elementDetection.results.filter(r => r.accuracy?.countAccuracy !== null).length,
      total: elementDetection.results.length
    };
    console.log(`   ✅ Average Accuracy: ${(elementDetection.averageAccuracy * 100).toFixed(1)}%\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // 4. Method Comparison
  console.log('4️⃣  Method Comparison (standard vs enhanced)');
  try {
    const methodComparison = await compareEvaluationMethods({ limit, provider });
    results.methods.methodComparison = {
      standardAverage: methodComparison.stats.standard.average,
      enhancedAverage: methodComparison.stats.enhanced.average,
      difference: methodComparison.stats.enhanced.average - methodComparison.stats.standard.average
    };
    console.log(`   ✅ Standard: ${methodComparison.stats.standard.average.toFixed(2)}/10, Enhanced: ${methodComparison.stats.enhanced.average.toFixed(2)}/10\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Summary
  console.log('📊 Comprehensive Results Summary:\n');
  if (results.methods.groundTruthValidation) {
    console.log(`   Ground Truth Validation: ${(results.methods.groundTruthValidation.averageAccuracy * 100).toFixed(1)}% accuracy`);
  }
  if (results.methods.elementDetection) {
    console.log(`   Element Detection: ${(results.methods.elementDetection.averageAccuracy * 100).toFixed(1)}% accuracy`);
  }
  if (results.methods.methodComparison) {
    console.log(`   Method Comparison: ${results.methods.methodComparison.difference > 0 ? '+' : ''}${results.methods.methodComparison.difference.toFixed(2)} score improvement with ground truth context`);
  }
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `comprehensive-ground-truth-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 10;
  const provider = process.argv[3] || null;
  runComprehensiveEvaluation({ limit, provider }).catch(console.error);
}

export { runComprehensiveEvaluation };

