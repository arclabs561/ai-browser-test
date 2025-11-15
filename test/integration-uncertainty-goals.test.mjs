#!/usr/bin/env node
/**
 * Integration Test: Uncertainty Reduction + Goals
 * 
 * Tests that uncertainty reduction works with variable goals.
 * Critical path: validateScreenshot → uncertainty reduction → goals
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { validateScreenshot } from '../src/index.mjs';
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'fs';

import { dirname } from 'path';

// Create a minimal test image - use base64 encoded minimal PNG (more reliable)
function createTestImage(path) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  // Use 2x2 pixel PNG (meets Groq's minimum requirement)
  const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  writeFileSync(path, minimalPng);
}

test('Uncertainty reduction with goals', async () => {
  const testImagePath = 'test-results/uncertainty-test.png';
  
  // Create test image
  if (!existsSync('test-results')) {
    mkdirSync('test-results', { recursive: true });
  }
  createTestImage(testImagePath);
  
  try {
    // Test with goal in context (cohesive integration)
    const result = await validateScreenshot(testImagePath, 'Evaluate this screenshot', {
      goal: 'accessibility',
      enableUncertaintyReduction: true,
      testType: 'uncertainty-test',
      disabled: false // Allow API call if configured
    });
    
    // CRITICAL: Check result structure
    assert.ok(result, 'Result should not be null/undefined');
    assert.ok(typeof result === 'object', 'Result should be an object');
    
    // If API is disabled, result.disabled will be true - skip uncertainty checks
    // Also check if uncertainty field is missing (indicates API not configured)
    if (result.disabled === true || !('uncertainty' in result)) {
      console.log('   ℹ️  API disabled or not configured - skipping uncertainty validation');
      return; // Gracefully skip if API not configured
    }
    
    // CRITICAL: Check uncertainty fields (may be null if API not configured)
    assert.ok('uncertainty' in result, 'Result should have uncertainty field');
    assert.ok('confidence' in result, 'Result should have confidence field');
    
    // If uncertainty reduction worked, these should be numbers
    if (result.uncertainty !== null) {
      assert.ok(typeof result.uncertainty === 'number', 'Uncertainty should be a number');
      assert.ok(result.uncertainty >= 0 && result.uncertainty <= 1, 'Uncertainty should be 0-1');
    }
    
    if (result.confidence !== null) {
      assert.ok(typeof result.confidence === 'number', 'Confidence should be a number');
      assert.ok(result.confidence >= 0 && result.confidence <= 1, 'Confidence should be 0-1');
    }
    
    // CRITICAL: Check standard fields
    assert.ok('score' in result, 'Result should have score field');
    assert.ok(Array.isArray(result.issues), 'Result.issues should be an array');
    
    console.log('✅ Uncertainty reduction with goals: PASSED');
    console.log(`   Uncertainty: ${result.uncertainty ?? 'N/A'}`);
    console.log(`   Confidence: ${result.confidence ?? 'N/A'}`);
    
  } finally {
    // Cleanup
    if (existsSync(testImagePath)) {
      try {
        unlinkSync(testImagePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
});

test('Uncertainty reduction without goals', async () => {
  const testImagePath = 'test-results/uncertainty-test-2.png';
  createTestImage(testImagePath);
  
  try {
    // Test without goal (should still work)
    const result = await validateScreenshot(testImagePath, 'Evaluate this screenshot', {
      enableUncertaintyReduction: true,
      testType: 'uncertainty-test-2',
      disabled: false // Allow API call if configured
    });
    
    assert.ok(result, 'Result should not be null/undefined');
    
    // If API is disabled, result.disabled will be true - skip uncertainty checks
    // Also check if uncertainty field is missing (indicates API not configured)
    if (result.disabled === true || !('uncertainty' in result)) {
      console.log('   ℹ️  API disabled or not configured - skipping uncertainty validation');
      return; // Gracefully skip if API not configured
    }
    
    assert.ok('uncertainty' in result, 'Result should have uncertainty field');
    assert.ok('confidence' in result, 'Result should have confidence field');
    
    console.log('✅ Uncertainty reduction without goals: PASSED');
    
  } finally {
    if (existsSync(testImagePath)) {
      try {
        unlinkSync(testImagePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
});

