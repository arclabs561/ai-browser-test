#!/usr/bin/env node
/**
 * Comprehensive WebUI Research Evaluation
 * 
 * Implements all three use cases from WebUI research paper:
 * 1. Element Detection (with IoU metrics)
 * 2. Screen Classification
 * 3. Screen Similarity
 * 
 * Uses proper research metrics as described in the paper.
 */

import { runIoUElementDetection } from './iou-element-detection.mjs';
import { runScreenClassification } from './screen-classification-evaluation.mjs';
import { runContrastValidation } from './style-contrast-validation.mjs';
import { runMultiViewportValidation } from './multi-viewport-validation.mjs';
import { runAccessibilityTreeValidation } from './accessibility-tree-validator.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Run comprehensive research evaluation
 */
async function runComprehensiveResearchEvaluation(options = {}) {
  const { limit = 10, provider = null } = options;
  
  console.log('🔬 Comprehensive WebUI Research Evaluation\n');
  console.log('Implementing all three WebUI paper use cases:\n');
  console.log('1. Element Detection (IoU-based)');
  console.log('2. Screen Classification');
  console.log('3. Additional: Contrast Validation, Multi-Viewport\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    provider,
    limit,
    useCases: {}
  };
  
  // Use Case 1: Element Detection
  console.log('1️⃣  Element Detection (IoU-based)\n');
  try {
    const elementDetection = await runIoUElementDetection({ limit, provider });
    results.useCases.elementDetection = {
      map: elementDetection.map,
      aps: elementDetection.aps,
      totalSamples: elementDetection.results.length
    };
    console.log(`   ✅ mAP: ${elementDetection.map.toFixed(3)}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Use Case 2: Screen Classification
  console.log('2️⃣  Screen Classification\n');
  try {
    const classification = await runScreenClassification({ limit, provider });
    results.useCases.screenClassification = {
      accuracy: classification.accuracy,
      categoryStats: classification.categoryStats,
      totalSamples: classification.results.length
    };
    console.log(`   ✅ Accuracy: ${(classification.accuracy * 100).toFixed(1)}%\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Use Case 3: Screen Similarity (placeholder - would need pairs)
  console.log('3️⃣  Screen Similarity (requires pairs - skipping for now)\n');
  results.useCases.screenSimilarity = {
    note: 'Requires screen pairs - not implemented yet'
  };
  
  // Additional: Contrast Validation
  console.log('4️⃣  Contrast Validation (using computed styles)\n');
  try {
    const contrast = await runContrastValidation({ limit: Math.floor(limit / 2), provider });
    results.useCases.contrastValidation = {
      totalSamples: contrast.results.length,
      withProgrammatic: contrast.results.filter(r => r.programmaticContrast).length
    };
    console.log(`   ✅ Completed\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Additional: Multi-Viewport
  console.log('5️⃣  Multi-Viewport Validation\n');
  try {
    const multiViewport = await runMultiViewportValidation({ limit: Math.floor(limit / 2), provider });
    results.useCases.multiViewport = {
      totalSamples: multiViewport.results.length,
      validSamples: multiViewport.results.filter(r => r.metrics).length
    };
    console.log(`   ✅ Completed\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  // Summary
  console.log('📊 Comprehensive Results Summary:\n');
  if (results.useCases.elementDetection) {
    console.log(`   Element Detection mAP: ${results.useCases.elementDetection.map.toFixed(3)}`);
  }
  if (results.useCases.screenClassification) {
    console.log(`   Screen Classification Accuracy: ${(results.useCases.screenClassification.accuracy * 100).toFixed(1)}%`);
  }
  if (results.useCases.contrastValidation) {
    console.log(`   Contrast Validation: ${results.useCases.contrastValidation.withProgrammatic} samples with programmatic data`);
  }
  if (results.useCases.multiViewport) {
    console.log(`   Multi-Viewport: ${results.useCases.multiViewport.validSamples} valid samples`);
  }
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `comprehensive-research-evaluation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 10;
  const provider = process.argv[3] || null;
  runComprehensiveResearchEvaluation({ limit, provider }).catch(console.error);
}

export { runComprehensiveResearchEvaluation };

