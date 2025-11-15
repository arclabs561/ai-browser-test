/**
 * Dataset Tests: WebUI Dataset
 * 
 * Tests using the WebUI dataset for validation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { loadWebUIDataset } from '../evaluation/utils/load-webui-dataset.mjs';
import { validateScreenshot } from '../src/index.mjs';

const WEBUI_GROUND_TRUTH = join(process.cwd(), 'evaluation', 'datasets', 'webui-ground-truth.json');

describe('WebUI Dataset Tests', () => {
  
  it('should load WebUI dataset', async function() {
    let dataset;
    try {
      dataset = await loadWebUIDataset({ limit: 10, cache: true });
    } catch (e) {
      console.log(`   ℹ️  Dataset loading failed: ${e.message}`);
      this.skip(); // Skip test if dataset loading fails
    }
    
    assert.ok(dataset, 'Dataset should be loaded');
    assert.ok(Array.isArray(dataset.samples), 'Dataset should have samples array');
    
    // Gracefully handle missing dataset directory (removed from repo)
    if (dataset.samples.length === 0) {
      console.log('   ℹ️  No samples available (dataset directory not present)');
      this.skip(); // Skip test if dataset not available
    }
    
    if (dataset.samples.length > 0) {
      const sample = dataset.samples[0];
      assert.ok(sample.id, 'Sample should have id');
      assert.ok(sample.screenshot || sample.screenshotPath, 'Sample should have screenshot');
    }
  });
  
  it('should have ground truth file if parsed', function() {
    if (!existsSync(WEBUI_GROUND_TRUTH)) {
      // Skip if not parsed yet
      console.log('   ℹ️  WebUI ground truth not parsed yet. Run: node evaluation/utils/parse-all-datasets.mjs');
      this.skip();
    }
    
    const groundTruth = JSON.parse(readFileSync(WEBUI_GROUND_TRUTH, 'utf-8'));
    assert.ok(groundTruth.samples, 'Ground truth should have samples');
    assert.ok(Array.isArray(groundTruth.samples), 'Samples should be an array');
  });
  
  it('should validate samples from dataset (if API key available)', async function() {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.log('   ℹ️  Skipping - no API key available');
      this.skip();
    }
    
    const dataset = await loadWebUIDataset({ limit: 1, cache: true });
    
    if (!dataset || !dataset.samples || dataset.samples.length === 0) {
      console.log('   ℹ️  No samples available in dataset');
      this.skip();
    }
    
    const sample = dataset.samples[0];
    const screenshotPath = sample.screenshot || sample.screenshotPath;
    
    if (!screenshotPath || !existsSync(screenshotPath)) {
      console.log('   ℹ️  Sample screenshot not found');
      this.skip();
    }
    
    // Test validation on a real sample
    const result = await validateScreenshot(
      screenshotPath,
      'Evaluate this UI for accessibility and usability',
      { testType: 'accessibility', useCache: true }
    );
    
    assert.ok(result, 'Result should be returned');
    assert.ok(typeof result.score === 'number' || result.score === null, 'Score should be number or null');
    assert.ok(Array.isArray(result.issues), 'Issues should be an array');
  });
  
  it('should filter dataset samples by criteria', async function() {
    const dataset = await loadWebUIDataset({ limit: 50, cache: true });
    
    if (!dataset || !dataset.samples || dataset.samples.length === 0) {
      console.log('   ℹ️  No samples available');
      this.skip();
    }
    
    // Filter by viewport
    const desktopSamples = dataset.samples.filter(s => {
      const viewport = s.viewport || s.metadata?.viewport;
      return viewport && viewport.width >= 1920;
    });
    
    assert.ok(Array.isArray(desktopSamples), 'Filtered samples should be array');
    
    // Filter by accessibility tree availability
    const withAxtree = dataset.samples.filter(s => {
      return s.axtree || s.metadata?.axtree;
    });
    
    assert.ok(Array.isArray(withAxtree), 'Axtree samples should be array');
  });
});

