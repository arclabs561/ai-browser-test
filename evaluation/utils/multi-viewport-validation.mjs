#!/usr/bin/env node
/**
 * Multi-Viewport Validation
 * 
 * Uses multiple viewport screenshots from WebUI dataset to validate
 * cross-device consistency and responsive design.
 * 
 * WebUI dataset includes screenshots for:
 * - Desktop (default_1920-1080, default_1366-768, etc.)
 * - Tablet (iPad-Pro)
 * - Mobile (iPhone-13 Pro)
 */

import { loadWebUIDataset } from './load-webui-dataset.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Find all viewport screenshots for a sample
 */
function findViewportScreenshots(sampleDir) {
  const files = readdirSync(sampleDir);
  const viewports = {};
  
  // Extract viewport info from filenames
  const screenshotPattern = /(?:default|iPad-Pro|iPhone-13 Pro)[_-](\d+)[-x](\d+)[_-]screenshot/i;
  const devicePattern = /(iPad-Pro|iPhone-13 Pro|default)/i;
  
  for (const file of files) {
    if (file.includes('screenshot') && file.endsWith('.webp')) {
      const viewportMatch = file.match(screenshotPattern);
      const deviceMatch = file.match(devicePattern);
      
      if (viewportMatch || deviceMatch) {
        const device = deviceMatch ? deviceMatch[1] : 'default';
        const viewport = viewportMatch
          ? { width: parseInt(viewportMatch[1]), height: parseInt(viewportMatch[2]) }
          : null;
        
        const key = viewport ? `${viewport.width}x${viewport.height}` : device;
        
        if (!viewports[key]) {
          viewports[key] = {
            device,
            viewport,
            screenshot: join(sampleDir, file)
          };
        }
      }
    }
  }
  
  return Object.values(viewports);
}

/**
 * Evaluate consistency across viewports
 */
async function evaluateMultiViewport(sample, viewports, options = {}) {
  const { provider = null } = options;
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'vllm_disabled'
    };
  }
  
  if (viewports.length < 2) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'insufficient_viewports'
    };
  }
  
  const prompt = `Evaluate this webpage screenshot for:
- Visual design consistency
- Layout quality and organization
- Accessibility and usability
- Overall quality score (0-10)

Consider how this viewport/device affects the user experience.`;
  
  const evaluations = [];
  
  for (const viewport of viewports) {
    if (!existsSync(viewport.screenshot)) continue;
    
    try {
      const result = await validateScreenshot(
        viewport.screenshot,
        prompt,
        {
          provider: config.provider,
          apiKey: config.apiKey,
          testType: 'multi-viewport',
          viewport: viewport.viewport || { width: 1920, height: 1080 }
        }
      );
      
      evaluations.push({
        device: viewport.device,
        viewport: viewport.viewport,
        screenshot: viewport.screenshot,
        score: result.score,
        reasoning: result.reasoning,
        issues: result.issues || []
      });
    } catch (error) {
      console.log(`   ⚠️  Error evaluating ${viewport.device}: ${error.message}`);
    }
  }
  
  // Calculate consistency metrics
  const scores = evaluations.map(e => e.score).filter(s => s !== undefined);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const scoreVariance = scores.length > 0
    ? scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length
    : 0;
  const scoreStdDev = Math.sqrt(scoreVariance);
  
  // Consistency: lower variance = more consistent
  const consistency = scoreStdDev < 1 ? 'high' : (scoreStdDev < 2 ? 'medium' : 'low');
  
  return {
    sampleId: sample.id,
    url: sample.url,
    evaluations,
    metrics: {
      averageScore: avgScore,
      scoreVariance,
      scoreStdDev,
      consistency,
      viewportCount: evaluations.length
    }
  };
}

/**
 * Run multi-viewport validation
 */
async function runMultiViewportValidation(options = {}) {
  const { limit = 10, provider = null } = options;
  
  console.log('📱 Multi-Viewport Validation\n');
  console.log('Evaluating consistency across different viewports/devices\n');
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  const samples = dataset.samples.slice(0, limit);
  
  console.log(`📊 Evaluating ${samples.length} samples\n`);
  
  const results = [];
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    
    // Find viewport screenshots
    const sampleDir = sample.screenshot
      ? sample.screenshot.substring(0, sample.screenshot.lastIndexOf('/'))
      : join(
          process.cwd(),
          'evaluation/datasets/human-annotated/visual-ui-understanding/webui-dataset/webui-7k',
          sample.id
        );
    
    if (!existsSync(sampleDir)) {
      console.log(`[${i + 1}/${samples.length}] ${sample.id} - directory not found`);
      continue;
    }
    
    const viewports = findViewportScreenshots(sampleDir);
    
    console.log(`[${i + 1}/${samples.length}] ${sample.id} (${viewports.length} viewports)`);
    
    if (viewports.length < 2) {
      console.log(`   ⚠️  Insufficient viewports (need 2+, found ${viewports.length})`);
      continue;
    }
    
    try {
      const result = await evaluateMultiViewport(sample, viewports, { provider: config.provider });
      results.push(result);
      
      console.log(`   ✅ Avg: ${result.metrics.averageScore.toFixed(2)}/10, Consistency: ${result.metrics.consistency} (σ=${result.metrics.scoreStdDev.toFixed(2)})`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        sampleId: sample.id,
        status: 'error',
        error: error.message
      });
    }
  }
  
  // Overall statistics
  const validResults = results.filter(r => r.metrics);
  const overallAvg = validResults.length > 0
    ? validResults.reduce((sum, r) => sum + r.metrics.averageScore, 0) / validResults.length
    : 0;
  const overallConsistency = validResults.length > 0
    ? validResults.reduce((sum, r) => sum + (r.metrics.consistency === 'high' ? 1 : 0), 0) / validResults.length
    : 0;
  
  console.log(`\n📊 Results:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Valid: ${validResults.length}`);
  console.log(`   Overall average score: ${overallAvg.toFixed(2)}/10`);
  console.log(`   High consistency: ${(overallConsistency * 100).toFixed(1)}%`);
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `multi-viewport-validation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    provider: config.provider,
    totalSamples: results.length,
    validSamples: validResults.length,
    overallAverageScore: overallAvg,
    overallConsistency,
    results
  }, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return { results };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 10;
  const provider = process.argv[3] || null;
  runMultiViewportValidation({ limit, provider }).catch(console.error);
}

export { runMultiViewportValidation, evaluateMultiViewport, findViewportScreenshots };

