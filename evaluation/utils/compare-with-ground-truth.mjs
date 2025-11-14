#!/usr/bin/env node
/**
 * Compare Evaluation Results with Ground Truth
 * 
 * Compares VLLM evaluation results against ground truth annotations
 * from the WebUI dataset (accessibility trees, bounding boxes, etc.).
 */

import { loadWebUIDataset } from './load-webui-dataset.mjs';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results');

/**
 * Load latest evaluation result
 */
function loadLatestResult() {
  const files = readdirSync(RESULTS_DIR)
    .filter(f => f.startsWith('webui-evaluation-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: join(RESULTS_DIR, f),
      mtime: statSync(join(RESULTS_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  if (files.length === 0) {
    return null;
  }
  
  return JSON.parse(readFileSync(files[0].path, 'utf-8'));
}

/**
 * Compare results with ground truth
 */
async function compareWithGroundTruth() {
  console.log('🔍 Comparing Evaluation Results with Ground Truth\n');
  
  const result = loadLatestResult();
  if (!result) {
    console.error('❌ No evaluation results found');
    return;
  }
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  if (!dataset) {
    console.error('❌ Dataset not available');
    return;
  }
  
  // Create sample lookup
  const sampleMap = new Map();
  dataset.samples.forEach(s => sampleMap.set(s.id, s));
  
  console.log(`📊 Analyzing ${result.results.length} evaluation results\n`);
  
  // Compare each result with its ground truth
  const comparisons = [];
  
  for (const evalResult of result.results) {
    if (evalResult.status !== 'success') continue;
    
    const sample = sampleMap.get(evalResult.sampleId);
    if (!sample) continue;
    
    const comparison = {
      sampleId: evalResult.sampleId,
      url: evalResult.url,
      vllmScore: evalResult.score,
      hasGroundTruth: {
        accessibilityTree: sample.groundTruth?.hasAccessibilityTree || false,
        boundingBoxes: sample.groundTruth?.hasBoundingBoxes || false,
        styles: sample.groundTruth?.hasStyles || false,
        html: sample.groundTruth?.hasHtml || false
      },
      groundTruthAnnotations: {
        accessibilityTree: sample.annotations?.accessibilityTree ? 'available' : 'missing',
        boundingBoxes: sample.annotations?.boundingBoxes ? 'available' : 'missing',
        styles: sample.annotations?.styles ? 'available' : 'missing'
      }
    };
    
    comparisons.push(comparison);
  }
  
  // Analysis
  const withAxtree = comparisons.filter(c => c.hasGroundTruth.accessibilityTree).length;
  const withBoxes = comparisons.filter(c => c.hasGroundTruth.boundingBoxes).length;
  const withStyles = comparisons.filter(c => c.hasGroundTruth.styles).length;
  
  console.log('Ground Truth Coverage:');
  console.log(`  Accessibility Trees: ${withAxtree}/${comparisons.length}`);
  console.log(`  Bounding Boxes: ${withBoxes}/${comparisons.length}`);
  console.log(`  Styles: ${withStyles}/${comparisons.length}\n`);
  
  // Score analysis by ground truth availability
  const withAllGT = comparisons.filter(c => 
    c.hasGroundTruth.accessibilityTree && 
    c.hasGroundTruth.boundingBoxes && 
    c.hasGroundTruth.styles
  );
  
  const withoutGT = comparisons.filter(c => 
    !c.hasGroundTruth.accessibilityTree && 
    !c.hasGroundTruth.boundingBoxes && 
    !c.hasGroundTruth.styles
  );
  
  if (withAllGT.length > 0) {
    const avgScoreWithGT = withAllGT.reduce((sum, c) => sum + c.vllmScore, 0) / withAllGT.length;
    console.log(`Samples with full ground truth (${withAllGT.length}):`);
    console.log(`  Average VLLM Score: ${avgScoreWithGT.toFixed(2)}/10\n`);
  }
  
  if (withoutGT.length > 0) {
    const avgScoreWithoutGT = withoutGT.reduce((sum, c) => sum + c.vllmScore, 0) / withoutGT.length;
    console.log(`Samples without ground truth (${withoutGT.length}):`);
    console.log(`  Average VLLM Score: ${avgScoreWithoutGT.toFixed(2)}/10\n`);
  }
  
  // Save comparison
  const comparisonFile = join(RESULTS_DIR, `ground-truth-comparison-${Date.now()}.json`);
  writeFileSync(comparisonFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    evaluation: result.timestamp,
    totalComparisons: comparisons.length,
    comparisons
  }, null, 2));
  
  console.log(`💾 Comparison saved: ${comparisonFile}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  compareWithGroundTruth().catch(console.error);
}

export { compareWithGroundTruth };

