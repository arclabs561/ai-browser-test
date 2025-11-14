#!/usr/bin/env node
/**
 * Enhanced WebUI Evaluation with Ground Truth Integration
 * 
 * Uses ground truth annotations to:
 * 1. Enhance prompts with context
 * 2. Validate VLLM outputs
 * 3. Calculate accuracy metrics
 * 4. Compare different evaluation methods
 */

import { loadWebUIDataset } from './load-webui-dataset.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { extractAccessibilityInfo, extractElementLocations } from './validate-with-ground-truth.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Build enhanced prompt with ground truth context
 */
function buildEnhancedPrompt(sample, includeGroundTruth = true) {
  let prompt = `Evaluate this webpage screenshot for accessibility, design, and usability.

Provide a comprehensive analysis including:
- Visual design quality
- Accessibility compliance (WCAG)
- Usability and clarity
- Specific element counts (buttons, links, headings, images)
- Overall quality score (0-10)`;

  if (includeGroundTruth && sample.annotations) {
    const axtreeInfo = extractAccessibilityInfo(sample.annotations.accessibilityTree);
    const boxInfo = extractElementLocations(sample.annotations.boundingBoxes);
    
    if (axtreeInfo) {
      prompt += `\n\nGROUND TRUTH CONTEXT (for reference, not to copy):
- Total elements in accessibility tree: ${axtreeInfo.totalElements}
- Interactive elements: ${axtreeInfo.interactiveElements.length}
- Buttons: ${axtreeInfo.buttons.length}
- Links: ${axtreeInfo.links.length}
- Headings: ${axtreeInfo.headings.length}
- Images: ${axtreeInfo.images.length}
- Landmarks: ${axtreeInfo.landmarks.length}
- ARIA labels: ${axtreeInfo.ariaLabels}/${axtreeInfo.totalElements}

Use this context to provide more accurate analysis, but evaluate based on what you see in the screenshot.`;
    }
  }
  
  return prompt;
}

/**
 * Enhanced evaluation with ground truth
 */
async function evaluateEnhanced(sample, options = {}) {
  const { provider = null, useGroundTruthContext = true } = options;
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'vllm_disabled'
    };
  }
  
  const prompt = buildEnhancedPrompt(sample, useGroundTruthContext);
  
  const result = await validateScreenshot(
    sample.screenshot,
    prompt,
    {
      provider: config.provider,
      apiKey: config.apiKey,
      testType: 'enhanced-evaluation',
      viewport: sample.viewport
    }
  );
  
  // Extract ground truth for comparison
  const axtreeInfo = sample.annotations?.accessibilityTree 
    ? extractAccessibilityInfo(sample.annotations.accessibilityTree)
    : null;
  const boxInfo = sample.annotations?.boundingBoxes
    ? extractElementLocations(sample.annotations.boundingBoxes)
    : null;
  
  return {
    sampleId: sample.id,
    url: sample.url,
    viewport: sample.viewport,
    vllmResult: {
      score: result.score,
      reasoning: result.reasoning,
      issues: result.issues || []
    },
    groundTruth: {
      accessibilityTree: axtreeInfo,
      boundingBoxes: boxInfo
    },
    metadata: {
      usedGroundTruthContext: useGroundTruthContext,
      hasAccessibilityTree: !!axtreeInfo,
      hasBoundingBoxes: !!boxInfo
    }
  };
}

/**
 * Compare standard vs enhanced evaluation
 */
async function compareEvaluationMethods(options = {}) {
  const { limit = 15, provider = null } = options;
  
  console.log('🔬 Comparing Evaluation Methods\n');
  console.log('Standard vs Enhanced (with ground truth context)\n');
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  const samplesWithGT = dataset.samples
    .filter(s => s.groundTruth?.hasAccessibilityTree)
    .slice(0, limit);
  
  console.log(`📊 Comparing ${samplesWithGT.length} samples\n`);
  
  const results = {
    standard: [],
    enhanced: []
  };
  
  for (let i = 0; i < samplesWithGT.length; i++) {
    const sample = samplesWithGT[i];
    console.log(`[${i + 1}/${samplesWithGT.length}] ${sample.id}`);
    
    // Standard evaluation
    process.stdout.write('   Standard... ');
    try {
      const standardResult = await evaluateEnhanced(sample, { 
        provider: config.provider, 
        useGroundTruthContext: false 
      });
      results.standard.push(standardResult);
      console.log(`✅ ${standardResult.vllmResult.score}/10`);
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
    
    // Enhanced evaluation
    process.stdout.write('   Enhanced... ');
    try {
      const enhancedResult = await evaluateEnhanced(sample, { 
        provider: config.provider, 
        useGroundTruthContext: true 
      });
      results.enhanced.push(enhancedResult);
      console.log(`✅ ${enhancedResult.vllmResult.score}/10`);
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }
  
  // Calculate statistics
  const standardScores = results.standard
    .filter(r => r.vllmResult?.score !== undefined)
    .map(r => r.vllmResult.score);
  const enhancedScores = results.enhanced
    .filter(r => r.vllmResult?.score !== undefined)
    .map(r => r.vllmResult.score);
  
  const stats = {
    standard: {
      count: standardScores.length,
      average: standardScores.length > 0 
        ? standardScores.reduce((a, b) => a + b, 0) / standardScores.length 
        : 0,
      min: standardScores.length > 0 ? Math.min(...standardScores) : 0,
      max: standardScores.length > 0 ? Math.max(...standardScores) : 0
    },
    enhanced: {
      count: enhancedScores.length,
      average: enhancedScores.length > 0
        ? enhancedScores.reduce((a, b) => a + b, 0) / enhancedScores.length
        : 0,
      min: enhancedScores.length > 0 ? Math.min(...enhancedScores) : 0,
      max: enhancedScores.length > 0 ? Math.max(...enhancedScores) : 0
    }
  };
  
  console.log('\n📊 Comparison Results:');
  console.log(`   Standard: ${stats.standard.average.toFixed(2)}/10 (${stats.standard.count} samples)`);
  console.log(`   Enhanced: ${stats.enhanced.average.toFixed(2)}/10 (${stats.enhanced.count} samples)`);
  console.log(`   Difference: ${(stats.enhanced.average - stats.standard.average).toFixed(2)}`);
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `enhanced-comparison-${Date.now()}.json`);
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
  const limit = parseInt(process.argv[2]) || 15;
  const provider = process.argv[3] || null;
  compareEvaluationMethods({ limit, provider }).catch(console.error);
}

export { compareEvaluationMethods, evaluateEnhanced, buildEnhancedPrompt };

