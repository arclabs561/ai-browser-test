#!/usr/bin/env node
/**
 * Style-Based Contrast Validation
 * 
 * Uses computed styles from WebUI dataset to validate contrast ratios
 * and compare with VLLM accessibility claims.
 */

import { loadWebUIDataset } from './load-webui-dataset.mjs';
import { extractAccessibilityInfo } from './validate-with-ground-truth.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { readGzippedJson } from './gzip-utils.mjs';

/**
 * Calculate contrast ratio from RGB values
 */
function calculateContrastRatio(color1, color2) {
  // Convert to relative luminance
  function getLuminance(rgb) {
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse color string to RGB
 */
function parseColor(colorStr) {
  if (!colorStr) return null;
  
  // Handle hex colors
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      ];
    } else if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
  }
  
  // Handle rgb() format
  const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3])
    ];
  }
  
  return null;
}

/**
 * Extract contrast information from styles
 */
function extractContrastFromStyles(styles, axtreeInfo) {
  if (!styles || !axtreeInfo) return null;
  
  // Handle different style formats
  const styleData = Array.isArray(styles) ? styles : (styles.elements || styles);
  
  if (!Array.isArray(styleData)) return null;
  
  const contrastChecks = [];
  let passing = 0;
  let failing = 0;
  
  // Sample elements for contrast checking (limit to avoid performance issues)
  const textElements = axtreeInfo.interactiveElements
    .slice(0, 50) // Limit to first 50 for performance
    .map(el => {
      // Try to find corresponding style
      const style = styleData.find(s => 
        s.nodeId === el.nodeId || 
        s.id === el.id ||
        (s.element && s.element.name === el.name)
      );
      
      if (style) {
        const bgColor = parseColor(style.backgroundColor || style.background || style['background-color']);
        const textColor = parseColor(style.color || style.textColor);
        
        if (bgColor && textColor) {
          const ratio = calculateContrastRatio(textColor, bgColor);
          const passes = ratio >= 4.5; // WCAG AA for normal text
          
          if (passes) passing++;
          else failing++;
          
          contrastChecks.push({
            element: el.name || 'unknown',
            role: el.role,
            textColor,
            backgroundColor: bgColor,
            contrastRatio: ratio,
            passes: passes,
            required: 4.5
          });
        }
      }
      
      return null;
    })
    .filter(Boolean);
  
  return {
    totalChecked: contrastChecks.length,
    passing,
    failing,
    violations: contrastChecks.filter(c => !c.passes),
    averageRatio: contrastChecks.length > 0
      ? contrastChecks.reduce((sum, c) => sum + c.contrastRatio, 0) / contrastChecks.length
      : 0
  };
}

/**
 * Validate contrast using styles + VLLM
 */
async function validateContrastWithStyles(sample, options = {}) {
  const { provider = null } = options;
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'vllm_disabled'
    };
  }
  
  // Load styles if not already loaded
  let styles = sample.annotations?.styles;
  if (!styles && sample.metadata?.sampleId) {
    // Try to load from file
    const styleFile = join(
      process.cwd(),
      'evaluation/datasets/human-annotated/visual-ui-understanding/webui-dataset/webui-7k',
      sample.metadata.sampleId,
      'default_1920-1080-style.json.gz'
    );
    try {
      styles = await readGzippedJson(styleFile);
    } catch (e) {
      // File not found or error
    }
  }
  
  const axtreeInfo = sample.annotations?.accessibilityTree
    ? extractAccessibilityInfo(sample.annotations.accessibilityTree)
    : null;
  
  const programmaticContrast = extractContrastFromStyles(styles, axtreeInfo);
  
  // Build prompt with programmatic contrast data
  let prompt = `Evaluate this webpage screenshot for color contrast accessibility (WCAG 2.1).

Check for:
- Text contrast ratios (should be ≥4.5:1 for normal text, ≥3:1 for large text)
- Background and foreground color combinations
- Overall contrast accessibility score (0-10)`;

  if (programmaticContrast) {
    prompt += `\n\nPROGRAMMATIC CONTRAST DATA (from computed styles):
- Elements checked: ${programmaticContrast.totalChecked}
- Passing: ${programmaticContrast.passing}
- Failing: ${programmaticContrast.failing}
- Average contrast ratio: ${programmaticContrast.averageRatio.toFixed(2)}:1
${programmaticContrast.violations.length > 0 ? `
Top violations:
${programmaticContrast.violations.slice(0, 5).map(v => 
  `  - ${v.element}: ${v.contrastRatio.toFixed(2)}:1 (required: ${v.required}:1)`
).join('\n')}
` : ''}

Use this programmatic data as ground truth. Evaluate semantic aspects:
1. Are contrast violations critical or acceptable in context?
2. Is overall contrast adequate for readability?
3. Are there contrast issues beyond what programmatic checks show?`;
  }
  
  // VLLM evaluation
  const vllmResult = await validateScreenshot(
    sample.screenshot,
    prompt,
    {
      provider: config.provider,
      apiKey: config.apiKey,
      testType: 'contrast-validation',
      viewport: sample.viewport
    }
  );
  
  return {
    sampleId: sample.id,
    url: sample.url,
    programmaticContrast,
    vllmResult: {
      score: vllmResult.score,
      reasoning: vllmResult.reasoning,
      issues: vllmResult.issues || []
    },
    comparison: programmaticContrast ? {
      programmaticPassRate: programmaticContrast.totalChecked > 0
        ? programmaticContrast.passing / programmaticContrast.totalChecked
        : 0,
      vllmScore: vllmResult.score
    } : null
  };
}

/**
 * Run contrast validation evaluation
 */
async function runContrastValidation(options = {}) {
  const { limit = 15, provider = null } = options;
  
  console.log('🎨 Style-Based Contrast Validation\n');
  console.log('Using computed styles from WebUI dataset for contrast validation\n');
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  const samplesWithStyles = dataset.samples
    .filter(s => s.groundTruth?.hasStyles && s.groundTruth?.hasAccessibilityTree)
    .slice(0, limit);
  
  console.log(`📊 Evaluating ${samplesWithStyles.length} samples with styles and accessibility trees\n`);
  
  const results = [];
  
  for (let i = 0; i < samplesWithStyles.length; i++) {
    const sample = samplesWithStyles[i];
    console.log(`[${i + 1}/${samplesWithStyles.length}] ${sample.id}`);
    
    try {
      const result = await validateContrastWithStyles(sample, { provider: config.provider });
      results.push(result);
      
      if (result.programmaticContrast) {
        const passRate = result.programmaticContrast.totalChecked > 0
          ? (result.programmaticContrast.passing / result.programmaticContrast.totalChecked) * 100
          : 0;
        console.log(`   Contrast: ${result.programmaticContrast.passing}/${result.programmaticContrast.totalChecked} pass (${passRate.toFixed(1)}%), VLLM: ${result.vllmResult.score}/10`);
      } else {
        console.log(`   VLLM: ${result.vllmResult.score}/10`);
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
  const withProgrammatic = results.filter(r => r.programmaticContrast).length;
  const avgPassRate = withProgrammatic > 0
    ? results
        .filter(r => r.programmaticContrast)
        .map(r => r.comparison?.programmaticPassRate || 0)
        .reduce((a, b) => a + b, 0) / withProgrammatic
    : 0;
  const avgVLLMScore = results
    .filter(r => r.vllmResult?.score !== undefined)
    .map(r => r.vllmResult.score)
    .reduce((a, b) => a + b, 0) / results.filter(r => r.vllmResult?.score !== undefined).length || 0;
  
  console.log(`\n📊 Results:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   With programmatic data: ${withProgrammatic}`);
  console.log(`   Average contrast pass rate: ${(avgPassRate * 100).toFixed(1)}%`);
  console.log(`   Average VLLM score: ${avgVLLMScore.toFixed(2)}/10`);
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `contrast-validation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    provider: config.provider,
    totalSamples: results.length,
    withProgrammatic,
    averagePassRate: avgPassRate,
    averageVLLMScore: avgVLLMScore,
    results
  }, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return { results };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 15;
  const provider = process.argv[3] || null;
  runContrastValidation({ limit, provider }).catch(console.error);
}

export { runContrastValidation, validateContrastWithStyles, calculateContrastRatio, extractContrastFromStyles };

