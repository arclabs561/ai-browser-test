#!/usr/bin/env node
/**
 * Accessibility Tree Validator
 * 
 * Validates accessibility using the actual accessibility tree from WebUI dataset.
 * Compares programmatic accessibility checks with VLLM semantic evaluation.
 */

import { loadWebUIDataset } from './load-webui-dataset.mjs';
import { extractAccessibilityInfo } from './validate-with-ground-truth.mjs';
import { checkAllTextContrast, checkKeyboardNavigation } from '../../src/validators/index.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Extract programmatic accessibility data from accessibility tree
 */
function extractProgrammaticA11y(axtreeInfo) {
  if (!axtreeInfo) return null;
  
  return {
    totalElements: axtreeInfo.totalElements,
    interactiveElements: axtreeInfo.interactiveElements.length,
    buttons: axtreeInfo.buttons.length,
    links: axtreeInfo.links.length,
    headings: axtreeInfo.headings.length,
    landmarks: axtreeInfo.landmarks.length,
    formControls: axtreeInfo.formControls.length,
    images: axtreeInfo.images.length,
    ariaLabels: axtreeInfo.ariaLabels,
    missingLabels: axtreeInfo.missingLabels.length,
    roles: axtreeInfo.roles
  };
}

/**
 * Validate accessibility using tree + VLLM
 */
async function validateAccessibilityWithTree(sample, options = {}) {
  const { provider = null } = options;
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'vllm_disabled'
    };
  }
  
  // Extract programmatic data from accessibility tree
  const axtreeInfo = sample.annotations?.accessibilityTree
    ? extractAccessibilityInfo(sample.annotations.accessibilityTree)
    : null;
  
  const programmaticData = axtreeInfo ? extractProgrammaticA11y(axtreeInfo) : null;
  
  // Build prompt with programmatic context
  let prompt = `Evaluate this webpage screenshot for accessibility compliance (WCAG 2.1).

Focus on:
- Color contrast (should be ≥4.5:1 for normal text, ≥3:1 for large text)
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels and semantic structure
- Overall accessibility score (0-10)`;

  if (programmaticData) {
    prompt += `\n\nPROGRAMMATIC DATA (from accessibility tree):
- Total elements: ${programmaticData.totalElements}
- Interactive elements: ${programmaticData.interactiveElements}
- Buttons: ${programmaticData.buttons}
- Links: ${programmaticData.links}
- Headings: ${programmaticData.headings}
- Landmarks: ${programmaticData.landmarks}
- Form controls: ${programmaticData.formControls}
- Images: ${programmaticData.images}
- Elements with ARIA labels: ${programmaticData.ariaLabels}
- Elements missing labels: ${programmaticData.missingLabels}

Use this programmatic data as ground truth. Evaluate semantic aspects:
1. Are the interactive elements properly labeled?
2. Is the structure logical and navigable?
3. Are there accessibility issues beyond what the tree shows?
4. How does the visual design support accessibility?`;
  }
  
  // VLLM evaluation
  const vllmResult = await validateScreenshot(
    sample.screenshot,
    prompt,
    {
      provider: config.provider,
      apiKey: config.apiKey,
      testType: 'accessibility-tree',
      viewport: sample.viewport
    }
  );
  
  return {
    sampleId: sample.id,
    url: sample.url,
    programmaticData,
    vllmResult: {
      score: vllmResult.score,
      reasoning: vllmResult.reasoning,
      issues: vllmResult.issues || []
    },
    comparison: programmaticData ? {
      elementsIdentified: programmaticData.totalElements,
      interactiveElements: programmaticData.interactiveElements,
      hasStructure: programmaticData.landmarks > 0 || programmaticData.headings > 0,
      hasLabels: programmaticData.ariaLabels > 0,
      missingLabels: programmaticData.missingLabels
    } : null
  };
}

/**
 * Run accessibility tree validation
 */
async function runAccessibilityTreeValidation(options = {}) {
  const { limit = 20, provider = null } = options;
  
  console.log('♿ Accessibility Tree Validation\n');
  console.log('Using accessibility trees from WebUI dataset for validation\n');
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  const samplesWithTree = dataset.samples
    .filter(s => s.groundTruth?.hasAccessibilityTree)
    .slice(0, limit);
  
  console.log(`📊 Evaluating ${samplesWithTree.length} samples with accessibility trees\n`);
  
  const results = [];
  
  for (let i = 0; i < samplesWithTree.length; i++) {
    const sample = samplesWithTree[i];
    console.log(`[${i + 1}/${samplesWithTree.length}] ${sample.id} (${sample.url || 'N/A'})`);
    
    try {
      const result = await validateAccessibilityWithTree(sample, { provider: config.provider });
      results.push(result);
      
      if (result.programmaticData) {
        console.log(`   Elements: ${result.programmaticData.totalElements}, Interactive: ${result.programmaticData.interactiveElements}, Score: ${result.vllmResult.score}/10`);
      } else {
        console.log(`   Score: ${result.vllmResult.score}/10`);
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
  
  // Statistics
  const scores = results
    .filter(r => r.vllmResult?.score !== undefined)
    .map(r => r.vllmResult.score);
  const withProgrammatic = results.filter(r => r.programmaticData).length;
  
  console.log(`\n📊 Results:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   With programmatic data: ${withProgrammatic}`);
  console.log(`   Average score: ${scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0}/10`);
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `accessibility-tree-validation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    provider: config.provider,
    totalSamples: results.length,
    withProgrammatic,
    averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    results
  }, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return { results };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 20;
  const provider = process.argv[3] || null;
  runAccessibilityTreeValidation({ limit, provider }).catch(console.error);
}

export { runAccessibilityTreeValidation, validateAccessibilityWithTree };

