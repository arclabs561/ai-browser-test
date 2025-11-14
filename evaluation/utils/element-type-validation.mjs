#!/usr/bin/env node
/**
 * Element Type Validation
 * 
 * Uses class.json.gz annotations to validate element type detection.
 * Compares VLLM element type predictions with actual element classes.
 */

import { loadWebUIDataset } from './load-webui-dataset.mjs';
import { extractAccessibilityInfo } from './validate-with-ground-truth.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { readGzippedJson } from './gzip-utils.mjs';

/**
 * Extract element types from class annotations
 */
function extractElementTypes(classes, axtreeInfo) {
  if (!classes || !axtreeInfo) return null;
  
  // Handle different class formats
  const classData = Array.isArray(classes) ? classes : (classes.elements || classes);
  
  if (!Array.isArray(classData) && typeof classData !== 'object') return null;
  
  const elementTypes = {};
  const typeCounts = {};
  
  // Map classes to element types
  if (Array.isArray(classData)) {
    classData.forEach((cls, i) => {
      const type = cls.type || cls.class || cls.elementType || 'unknown';
      elementTypes[i] = type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
  } else if (typeof classData === 'object') {
    // Object format with node IDs as keys
    for (const [nodeId, cls] of Object.entries(classData)) {
      const type = cls.type || cls.class || cls.elementType || 'unknown';
      elementTypes[nodeId] = type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
  }
  
  return {
    elementTypes,
    typeCounts,
    totalElements: Object.keys(elementTypes).length
  };
}

/**
 * Validate element type detection
 */
async function validateElementTypes(sample, options = {}) {
  const { provider = null } = options;
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'vllm_disabled'
    };
  }
  
  // Try to load class data
  let classes = sample.annotations?.classes;
  if (!classes && sample.metadata?.sampleId) {
    const classFile = join(
      process.cwd(),
      'evaluation/datasets/human-annotated/visual-ui-understanding/webui-dataset/webui-7k',
      sample.metadata.sampleId,
      'default_1920-1080-class.json.gz'
    );
    try {
      classes = await readGzippedJson(classFile);
    } catch (e) {
      // File not found
    }
  }
  
  const axtreeInfo = sample.annotations?.accessibilityTree
    ? extractAccessibilityInfo(sample.annotations.accessibilityTree)
    : null;
  
  const elementTypes = extractElementTypes(classes, axtreeInfo);
  
  // Build prompt
  let prompt = `Analyze this webpage screenshot and identify element types.

For each major element, identify its type:
- button
- link
- input (text, checkbox, radio, etc.)
- heading (h1, h2, etc.)
- image
- text
- container
- navigation
- form
- other

Provide counts for each type.`;
  
  if (elementTypes) {
    prompt += `\n\nGROUND TRUTH ELEMENT TYPES (for reference):
${Object.entries(elementTypes.typeCounts).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Use this as reference, but evaluate based on what you see in the screenshot.`;
  }
  
  const vllmResult = await validateScreenshot(
    sample.screenshot,
    prompt,
    {
      provider: config.provider,
      apiKey: config.apiKey,
      testType: 'element-type-validation'
    }
  );
  
  // Extract type counts from VLLM response
  const text = (vllmResult.reasoning || '').toLowerCase() + ' ' + (vllmResult.issues || []).join(' ').toLowerCase();
  const vllmTypeCounts = {};
  const typePatterns = {
    button: /\b(\d+)\s+button/i,
    link: /\b(\d+)\s+link/i,
    input: /\b(\d+)\s+input/i,
    heading: /\b(\d+)\s+heading/i,
    image: /\b(\d+)\s+image/i,
    text: /\b(\d+)\s+text/i
  };
  
  for (const [type, pattern] of Object.entries(typePatterns)) {
    const match = text.match(pattern);
    if (match) {
      vllmTypeCounts[type] = parseInt(match[1]);
    }
  }
  
  // Calculate accuracy
  let totalAccuracy = 0;
  let comparedTypes = 0;
  
  if (elementTypes) {
    for (const [type, gtCount] of Object.entries(elementTypes.typeCounts)) {
      const vllmCount = vllmTypeCounts[type] || 0;
      if (gtCount > 0 || vllmCount > 0) {
        const accuracy = Math.min(gtCount, vllmCount) / Math.max(gtCount, vllmCount);
        totalAccuracy += accuracy;
        comparedTypes++;
      }
    }
  }
  
  const averageAccuracy = comparedTypes > 0 ? totalAccuracy / comparedTypes : null;
  
  return {
    sampleId: sample.id,
    url: sample.url,
    groundTruth: elementTypes ? {
      typeCounts: elementTypes.typeCounts,
      totalElements: elementTypes.totalElements
    } : null,
    vllmTypeCounts,
    accuracy: averageAccuracy,
    vllmResult: {
      reasoning: vllmResult.reasoning,
      issues: vllmResult.issues || []
    }
  };
}

/**
 * Run element type validation
 */
async function runElementTypeValidation(options = {}) {
  const { limit = 15, provider = null } = options;
  
  console.log('🏷️  Element Type Validation\n');
  console.log('Validating element type detection using class annotations\n');
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  const samples = dataset.samples.slice(0, limit);
  
  console.log(`📊 Evaluating ${samples.length} samples\n`);
  
  const results = [];
  let totalAccuracy = 0;
  let validatedCount = 0;
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    console.log(`[${i + 1}/${samples.length}] ${sample.id}`);
    
    try {
      const result = await validateElementTypes(sample, { provider: config.provider });
      results.push(result);
      
      if (result.accuracy !== null && result.accuracy !== undefined) {
        totalAccuracy += result.accuracy;
        validatedCount++;
        console.log(`   ✅ Accuracy: ${(result.accuracy * 100).toFixed(1)}%`);
      } else {
        console.log(`   ⚠️  No class data available`);
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
  console.log(`   Average Accuracy: ${(averageAccuracy * 100).toFixed(1)}%`);
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `element-type-validation-${Date.now()}.json`);
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
  runElementTypeValidation({ limit, provider }).catch(console.error);
}

export { runElementTypeValidation, validateElementTypes, extractElementTypes };

