#!/usr/bin/env node
/**
 * Element Detection Accuracy Evaluation
 * 
 * Validates VLLM element detection claims against bounding box ground truth.
 * Calculates accuracy metrics for element detection tasks.
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
 * Evaluate element detection accuracy
 */
async function evaluateElementDetection(sample, options = {}) {
  const { provider = null } = options;
  
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
  
  // Ask VLLM to detect and count elements
  const prompt = `Analyze this webpage screenshot and identify interactive elements.

Count and describe:
- Total number of clickable/interactive elements (buttons, links, form inputs)
- Approximate locations of major interactive elements
- Types of elements present

Be specific about counts and locations.`;
  
  const vllmResult = await validateScreenshot(
    sample.screenshot,
    prompt,
    {
      provider: config.provider,
      apiKey: config.apiKey,
      testType: 'element-detection'
    }
  );
  
  // Extract element count from VLLM response
  const text = (vllmResult.reasoning || '').toLowerCase() + ' ' + (vllmResult.issues || []).join(' ').toLowerCase();
  const countMatch = text.match(/\b(\d+)\s+(?:element|interactive|clickable)/i);
  const vllmCount = countMatch ? parseInt(countMatch[1]) : null;
  
  // Calculate accuracy
  const groundTruthCount = boxInfo.totalElements;
  const countAccuracy = vllmCount !== null
    ? Math.min(vllmCount, groundTruthCount) / Math.max(vllmCount, groundTruthCount)
    : null;
  
  return {
    sampleId: sample.id,
    url: sample.url,
    groundTruth: {
      totalElements: groundTruthCount,
      elements: boxInfo.elements.slice(0, 10) // Sample of elements
    },
    vllmResult: {
      detectedCount: vllmCount,
      reasoning: vllmResult.reasoning,
      issues: vllmResult.issues || []
    },
    accuracy: {
      countAccuracy,
      groundTruthCount,
      vllmCount
    }
  };
}

/**
 * Run element detection accuracy evaluation
 */
async function runElementDetectionAccuracy(options = {}) {
  const { limit = 15, provider = null } = options;
  
  console.log('🎯 Element Detection Accuracy Evaluation\n');
  console.log('Comparing VLLM element detection with bounding box ground truth\n');
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  const samplesWithBoxes = dataset.samples
    .filter(s => s.groundTruth?.hasBoundingBoxes)
    .slice(0, limit);
  
  console.log(`📊 Evaluating ${samplesWithBoxes.length} samples with bounding boxes\n`);
  
  const results = [];
  let totalAccuracy = 0;
  let validatedCount = 0;
  
  for (let i = 0; i < samplesWithBoxes.length; i++) {
    const sample = samplesWithBoxes[i];
    console.log(`[${i + 1}/${samplesWithBoxes.length}] ${sample.id}`);
    
    try {
      const result = await evaluateElementDetection(sample, { provider: config.provider });
      results.push(result);
      
      if (result.accuracy?.countAccuracy !== null && result.accuracy?.countAccuracy !== undefined) {
        totalAccuracy += result.accuracy.countAccuracy;
        validatedCount++;
        console.log(`   ✅ Count: ${result.accuracy.vllmCount || 'N/A'} (GT: ${result.accuracy.groundTruthCount}), Accuracy: ${(result.accuracy.countAccuracy * 100).toFixed(1)}%`);
      } else {
        console.log(`   ⚠️  Could not extract count from VLLM response`);
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
  
  const averageAccuracy = validatedCount > 0 ? totalAccuracy / validatedCount : 0;
  
  console.log(`\n📊 Results:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Validated: ${validatedCount}`);
  console.log(`   Average Count Accuracy: ${(averageAccuracy * 100).toFixed(1)}%`);
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `element-detection-accuracy-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    provider: config.provider,
    totalSamples: results.length,
    validated: validatedCount,
    averageAccuracy,
    results
  }, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return { results, averageAccuracy };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 15;
  const provider = process.argv[3] || null;
  runElementDetectionAccuracy({ limit, provider }).catch(console.error);
}

export { runElementDetectionAccuracy, evaluateElementDetection, calculateIoU };

