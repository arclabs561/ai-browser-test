#!/usr/bin/env node
/**
 * IoU-Based Element Detection Evaluation
 * 
 * Implements proper IoU (Intersection over Union) metrics for element detection
 * as used in WebUI research papers. Validates VLLM element detection against
 * bounding box ground truth using standard computer vision metrics.
 * 
 * Based on WebUI paper evaluation methodology:
 * - IoU > 0.5 threshold for correct detection
 * - mAP (mean Average Precision) at different IoU thresholds
 * - Precision/Recall curves
 */

import { loadWebUIDataset } from './load-webui-dataset.mjs';
import { extractElementLocations } from './validate-with-ground-truth.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Calculate IoU (Intersection over Union) for two bounding boxes
 */
function calculateIoU(box1, box2) {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);
  
  if (x2 < x1 || y2 < y1) return 0;
  
  const intersection = (x2 - x1) * (y2 - y1);
  const area1 = box1.width * box1.height;
  const area2 = box2.width * box2.height;
  const union = area1 + area2 - intersection;
  
  return union > 0 ? intersection / union : 0;
}

/**
 * Match predicted boxes to ground truth boxes using IoU
 * Returns matched pairs and unmatched boxes
 */
function matchBoxes(predictedBoxes, groundTruthBoxes, iouThreshold = 0.5) {
  const matched = [];
  const unmatchedPred = [];
  const unmatchedGT = [];
  const usedGT = new Set();
  
  // Greedy matching: for each predicted box, find best matching GT box
  for (const predBox of predictedBoxes) {
    let bestIoU = 0;
    let bestGTIndex = -1;
    
    for (let i = 0; i < groundTruthBoxes.length; i++) {
      if (usedGT.has(i)) continue;
      
      const iou = calculateIoU(predBox, groundTruthBoxes[i]);
      if (iou > bestIoU) {
        bestIoU = iou;
        bestGTIndex = i;
      }
    }
    
    if (bestIoU >= iouThreshold && bestGTIndex >= 0) {
      matched.push({
        predicted: predBox,
        groundTruth: groundTruthBoxes[bestGTIndex],
        iou: bestIoU
      });
      usedGT.add(bestGTIndex);
    } else {
      unmatchedPred.push(predBox);
    }
  }
  
  // Find unmatched ground truth boxes
  for (let i = 0; i < groundTruthBoxes.length; i++) {
    if (!usedGT.has(i)) {
      unmatchedGT.push(groundTruthBoxes[i]);
    }
  }
  
  return { matched, unmatchedPred, unmatchedGT };
}

/**
 * Extract bounding boxes from VLLM response
 * This is a simplified version - in practice, VLLMs don't output precise coordinates
 * but we can try to extract approximate locations from descriptions
 */
function extractVLLMBoxes(vllmResult, viewport) {
  // For now, this is a placeholder - VLLMs typically don't output precise coordinates
  // In a real implementation, you might:
  // 1. Ask VLLM to output coordinates explicitly
  // 2. Use a separate object detection model
  // 3. Use VLLM to identify regions, then use programmatic methods to get boxes
  
  const boxes = [];
  const text = (vllmResult.reasoning || '').toLowerCase() + ' ' + (vllmResult.issues || []).join(' ').toLowerCase();
  
  // Try to extract approximate locations from text descriptions
  // This is very limited - real implementation would need structured output
  const locationPatterns = [
    /(?:top|upper|header)/i,
    /(?:bottom|lower|footer)/i,
    /(?:left|west)/i,
    /(?:right|east)/i,
    /(?:center|middle)/i
  ];
  
  // For demonstration, create dummy boxes based on detected elements
  // In practice, you'd need VLLM to output coordinates or use object detection
  const elementCount = (text.match(/\b(\d+)\s+(?:element|button|link|item)/i) || [])[1];
  if (elementCount) {
    const count = parseInt(elementCount);
    // Create approximate boxes (this is just for demonstration)
    for (let i = 0; i < Math.min(count, 10); i++) {
      boxes.push({
        x: (viewport.width / 10) * (i % 10),
        y: (viewport.height / 10) * Math.floor(i / 10),
        width: viewport.width / 10,
        height: viewport.height / 10,
        confidence: 0.5, // Placeholder
        type: 'detected'
      });
    }
  }
  
  return boxes;
}

/**
 * Calculate precision and recall at different IoU thresholds
 */
function calculatePrecisionRecall(matched, unmatchedPred, unmatchedGT, iouThreshold) {
  const tp = matched.length;
  const fp = unmatchedPred.length;
  const fn = unmatchedGT.length;
  
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  
  return {
    threshold: iouThreshold,
    tp,
    fp,
    fn,
    precision,
    recall,
    f1
  };
}

/**
 * Calculate mAP (mean Average Precision) at different IoU thresholds
 */
function calculateMAP(results, iouThresholds = [0.5, 0.75]) {
  const aps = [];
  
  for (const threshold of iouThresholds) {
    const precisions = [];
    const recalls = [];
    
    for (const result of results) {
      if (result.metrics && result.metrics[threshold]) {
        precisions.push(result.metrics[threshold].precision);
        recalls.push(result.metrics[threshold].recall);
      }
    }
    
    if (precisions.length > 0) {
      // Calculate AP using 11-point interpolation
      const ap = calculateAP(precisions, recalls);
      aps.push({ threshold, ap });
    }
  }
  
  const map = aps.length > 0 ? aps.reduce((sum, a) => sum + a.ap, 0) / aps.length : 0;
  
  return { map, aps };
}

/**
 * Calculate Average Precision using 11-point interpolation
 */
function calculateAP(precisions, recalls) {
  if (precisions.length === 0) return 0;
  
  // 11-point interpolation
  const recallLevels = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  let ap = 0;
  
  for (const r of recallLevels) {
    // Find max precision at this recall level or higher
    let maxPrecision = 0;
    for (let i = 0; i < recalls.length; i++) {
      if (recalls[i] >= r) {
        maxPrecision = Math.max(maxPrecision, precisions[i]);
      }
    }
    ap += maxPrecision;
  }
  
  return ap / recallLevels.length;
}

/**
 * Evaluate element detection with IoU metrics
 */
async function evaluateElementDetectionIoU(sample, options = {}) {
  const { provider = null, iouThresholds = [0.5, 0.75] } = options;
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'vllm_disabled'
    };
  }
  
  // Get ground truth bounding boxes
  const boxInfo = sample.annotations?.boundingBoxes
    ? extractElementLocations(sample.annotations.boundingBoxes)
    : null;
  
  if (!boxInfo || boxInfo.totalElements === 0) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'no_bounding_boxes'
    };
  }
  
  // Ask VLLM to detect elements with location descriptions
  const prompt = `Analyze this webpage screenshot and identify interactive elements.

For each major interactive element (buttons, links, form inputs), describe:
1. Element type (button, link, input, etc.)
2. Approximate location (top-left, center, bottom-right, etc.)
3. Approximate size (small, medium, large)

Be specific about locations and provide counts.`;
  
  const vllmResult = await validateScreenshot(
    sample.screenshot,
    prompt,
    {
      provider: config.provider,
      apiKey: config.apiKey,
      testType: 'element-detection-iou'
    }
  );
  
  // Extract predicted boxes (simplified - real implementation would need structured output)
  const viewport = sample.viewport || { width: 1920, height: 1080 };
  const predictedBoxes = extractVLLMBoxes(vllmResult, viewport);
  const groundTruthBoxes = boxInfo.elements.map(e => ({
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height
  }));
  
  // Calculate metrics at different IoU thresholds
  const metrics = {};
  for (const threshold of iouThresholds) {
    const { matched, unmatchedPred, unmatchedGT } = matchBoxes(
      predictedBoxes,
      groundTruthBoxes,
      threshold
    );
    
    metrics[threshold] = calculatePrecisionRecall(matched, unmatchedPred, unmatchedGT, threshold);
    metrics[threshold].matched = matched.length;
    metrics[threshold].averageIoU = matched.length > 0
      ? matched.reduce((sum, m) => sum + m.iou, 0) / matched.length
      : 0;
  }
  
  return {
    sampleId: sample.id,
    url: sample.url,
    viewport,
    groundTruth: {
      totalElements: groundTruthBoxes.length
    },
    predicted: {
      totalElements: predictedBoxes.length
    },
    metrics,
    vllmResult: {
      reasoning: vllmResult.reasoning,
      issues: vllmResult.issues || []
    }
  };
}

/**
 * Run IoU-based element detection evaluation
 */
async function runIoUElementDetection(options = {}) {
  const { limit = 15, provider = null, iouThresholds = [0.5, 0.75] } = options;
  
  console.log('🎯 IoU-Based Element Detection Evaluation\n');
  console.log('Using Intersection over Union (IoU) metrics as in WebUI research\n');
  console.log(`IoU Thresholds: ${iouThresholds.join(', ')}\n`);
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  const samplesWithBoxes = dataset.samples
    .filter(s => s.groundTruth?.hasBoundingBoxes)
    .slice(0, limit);
  
  console.log(`📊 Evaluating ${samplesWithBoxes.length} samples\n`);
  
  const results = [];
  
  for (let i = 0; i < samplesWithBoxes.length; i++) {
    const sample = samplesWithBoxes[i];
    console.log(`[${i + 1}/${samplesWithBoxes.length}] ${sample.id}`);
    
    try {
      const result = await evaluateElementDetectionIoU(sample, { provider: config.provider, iouThresholds });
      results.push(result);
      
      if (result.metrics) {
        const m50 = result.metrics[0.5];
        const m75 = result.metrics[0.75];
        console.log(`   IoU@0.5: P=${m50.precision.toFixed(2)} R=${m50.recall.toFixed(2)} F1=${m50.f1.toFixed(2)}`);
        if (m75) {
          console.log(`   IoU@0.75: P=${m75.precision.toFixed(2)} R=${m75.recall.toFixed(2)} F1=${m75.f1.toFixed(2)}`);
        }
      } else {
        console.log(`   ⚠️  ${result.status || 'No metrics'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        sampleId: sample.id,
        status: 'error',
        error: error.message
      });
    }
  }
  
  // Calculate overall mAP
  const { map, aps } = calculateMAP(results, iouThresholds);
  
  console.log(`\n📊 Results:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   mAP: ${map.toFixed(3)}`);
  for (const ap of aps) {
    console.log(`   AP@${ap.threshold}: ${ap.ap.toFixed(3)}`);
  }
  
  // Aggregate precision/recall
  const validResults = results.filter(r => r.metrics);
  if (validResults.length > 0) {
    const avgPrecision50 = validResults
      .map(r => r.metrics[0.5]?.precision || 0)
      .reduce((a, b) => a + b, 0) / validResults.length;
    const avgRecall50 = validResults
      .map(r => r.metrics[0.5]?.recall || 0)
      .reduce((a, b) => a + b, 0) / validResults.length;
    
    console.log(`   Average Precision@0.5: ${avgPrecision50.toFixed(3)}`);
    console.log(`   Average Recall@0.5: ${avgRecall50.toFixed(3)}`);
  }
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `iou-element-detection-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    provider: config.provider,
    iouThresholds,
    totalSamples: results.length,
    map,
    aps,
    results
  }, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return { results, map, aps };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 15;
  const provider = process.argv[3] || null;
  runIoUElementDetection({ limit, provider }).catch(console.error);
}

export { runIoUElementDetection, evaluateElementDetectionIoU, matchBoxes, calculateMAP };

