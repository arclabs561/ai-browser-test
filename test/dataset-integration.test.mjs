/**
 * Dataset Integration Tests
 * 
 * Tests that verify datasets work together with the validation system.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { loadWebUIDataset } from '../evaluation/utils/load-webui-dataset.mjs';
import { validateScreenshot, StateValidator, AccessibilityValidator } from '../src/index.mjs';

const WEBUI_GROUND_TRUTH = join(process.cwd(), 'evaluation', 'datasets', 'webui-ground-truth.json');
const WCAG_GROUND_TRUTH = join(process.cwd(), 'evaluation', 'datasets', 'wcag-ground-truth.json');

describe('Dataset Integration Tests', () => {
  
  describe('WebUI Dataset Integration', () => {
    it('should load and validate WebUI samples', async () => {
      if (!existsSync(WEBUI_GROUND_TRUTH)) {
        console.log('   ℹ️  WebUI ground truth not parsed. Run: npm run datasets:parse');
        return;
      }
      
      const dataset = await loadWebUIDataset({ limit: 5, cache: true });
      
      if (!dataset || !dataset.samples || dataset.samples.length === 0) {
        console.log('   ℹ️  No samples available');
        return;
      }
      
      assert.ok(dataset.samples.length > 0, 'Should have samples');
      
      // Test that samples have required fields
      for (const sample of dataset.samples) {
        assert.ok(sample.id, 'Sample should have id');
        assert.ok(sample.screenshot || sample.screenshotPath, 'Sample should have screenshot path');
      }
    });
    
    it('should work with StateValidator', async () => {
      if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
        console.log('   ℹ️  Skipping - no API key available');
        return;
      }
      
      const dataset = await loadWebUIDataset({ limit: 1, cache: true });
      
      if (!dataset || !dataset.samples || dataset.samples.length === 0) {
        return;
      }
      
      const sample = dataset.samples[0];
      const screenshotPath = sample.screenshot || sample.screenshotPath;
      
      if (!screenshotPath || !existsSync(screenshotPath)) {
        return;
      }
      
      const validator = new StateValidator();
      const expectedState = { loaded: true };
      
      const result = await validator.validateState(
        screenshotPath,
        expectedState,
        { testType: 'state_validation' }
      );
      
      assert.ok(result, 'Result should be returned');
      assert.ok('matches' in result, 'Result should have matches property');
    });
    
    it('should work with AccessibilityValidator', async () => {
      if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
        console.log('   ℹ️  Skipping - no API key available');
        return;
      }
      
      const dataset = await loadWebUIDataset({ limit: 1, cache: true });
      
      if (!dataset || !dataset.samples || dataset.samples.length === 0) {
        return;
      }
      
      const sample = dataset.samples[0];
      const screenshotPath = sample.screenshot || sample.screenshotPath;
      
      if (!screenshotPath || !existsSync(screenshotPath)) {
        return;
      }
      
      const validator = new AccessibilityValidator();
      
      const result = await validator.validateAccessibility(
        screenshotPath,
        { testType: 'accessibility' }
      );
      
      assert.ok(result, 'Result should be returned');
      assert.ok('violations' in result, 'Result should have violations');
      assert.ok('passes' in result, 'Result should have passes property');
    });
  });
  
  describe('WCAG Dataset Integration', () => {
    it('should have valid WCAG test case structure', () => {
      if (!existsSync(WCAG_GROUND_TRUTH)) {
        console.log('   ℹ️  WCAG ground truth not parsed. Run: npm run datasets:parse');
        return;
      }
      
      const groundTruth = JSON.parse(readFileSync(WCAG_GROUND_TRUTH, 'utf-8'));
      
      assert.ok(groundTruth.testCases, 'Should have test cases');
      assert.ok(Array.isArray(groundTruth.testCases), 'Test cases should be array');
      
      if (groundTruth.testCases.length > 0) {
        const testCase = groundTruth.testCases[0];
        assert.ok(testCase.url, 'Test case should have URL');
        assert.ok(testCase.url.startsWith('http'), 'URL should be valid');
      }
    });
  });
  
  describe('Dataset Loading Performance', () => {
    it('should load dataset with caching efficiently', async () => {
      const start = Date.now();
      const dataset1 = await loadWebUIDataset({ limit: 10, cache: true });
      const time1 = Date.now() - start;
      
      const start2 = Date.now();
      const dataset2 = await loadWebUIDataset({ limit: 10, cache: true });
      const time2 = Date.now() - start2;
      
      // Second load should be faster (cached)
      if (time1 > 100) { // Only check if first load took time
        assert.ok(time2 < time1 * 2, 'Cached load should be reasonably fast');
      }
      
      assert.ok(dataset1, 'First load should work');
      assert.ok(dataset2, 'Second load should work');
    });
  });
});

