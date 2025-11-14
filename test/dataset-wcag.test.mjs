/**
 * Dataset Tests: WCAG Test Cases
 * 
 * Tests using the WCAG test cases dataset.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const WCAG_GROUND_TRUTH = join(process.cwd(), 'evaluation', 'datasets', 'wcag-ground-truth.json');

describe('WCAG Dataset Tests', () => {
  
  it('should have WCAG ground truth file if parsed', () => {
    if (existsSync(WCAG_GROUND_TRUTH)) {
      const groundTruth = JSON.parse(readFileSync(WCAG_GROUND_TRUTH, 'utf-8'));
      
      assert.ok(groundTruth.name === 'WCAG Test Cases', 'Should be WCAG dataset');
      assert.ok(Array.isArray(groundTruth.testCases), 'Should have test cases array');
      assert.ok(groundTruth.totalTestCases > 0, 'Should have test cases');
      
      if (groundTruth.testCases.length > 0) {
        const testCase = groundTruth.testCases[0];
        assert.ok(testCase.id, 'Test case should have id');
        assert.ok(testCase.name, 'Test case should have name');
        assert.ok(testCase.url, 'Test case should have URL');
      }
    } else {
      console.log('   ℹ️  WCAG ground truth not parsed yet. Run: node evaluation/utils/parse-all-datasets.mjs');
    }
  });
  
  it('should have valid test case structure', () => {
    if (!existsSync(WCAG_GROUND_TRUTH)) {
      return;
    }
    
    const groundTruth = JSON.parse(readFileSync(WCAG_GROUND_TRUTH, 'utf-8'));
    
    for (const testCase of groundTruth.testCases.slice(0, 10)) {
      assert.ok(testCase.id, `Test case ${testCase.id} should have id`);
      assert.ok(testCase.name, `Test case ${testCase.id} should have name`);
      assert.ok(testCase.url, `Test case ${testCase.id} should have URL`);
      assert.ok(testCase.url.startsWith('http'), `Test case ${testCase.id} should have valid URL`);
      assert.ok(testCase.type === 'accessibility_test_case', `Test case ${testCase.id} should have correct type`);
    }
  });
  
  it('should have unique test case IDs', () => {
    if (!existsSync(WCAG_GROUND_TRUTH)) {
      return;
    }
    
    const groundTruth = JSON.parse(readFileSync(WCAG_GROUND_TRUTH, 'utf-8'));
    const ids = groundTruth.testCases.map(tc => tc.id);
    const uniqueIds = new Set(ids);
    
    assert.strictEqual(ids.length, uniqueIds.size, 'All test case IDs should be unique');
  });
  
  it('should have test cases from W3C source', () => {
    if (!existsSync(WCAG_GROUND_TRUTH)) {
      return;
    }
    
    const groundTruth = JSON.parse(readFileSync(WCAG_GROUND_TRUTH, 'utf-8'));
    
    assert.ok(groundTruth.source === 'W3C WCAG ACT Rules', 'Should be from W3C');
    assert.ok(groundTruth.testCases.every(tc => tc.source === 'W3C WCAG ACT Rules'), 
      'All test cases should be from W3C');
  });
});

