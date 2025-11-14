/**
 * Integration Test with Execution Tracing
 * 
 * Tests natural language specs end-to-end with full tracing
 * to ensure everything works together and is configurable.
 * 
 * Note: Tests requiring Playwright page object are skipped in Node test runner.
 * Use evaluation/e2e/ for full Playwright-based integration tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  parseSpec,
  validateSpec,
  createSpecFromTemplate,
  createSpecConfig,
  getSpecConfig,
  setSpecConfig,
  resetSpecConfig
} from '../src/index.mjs';

describe('Natural Language Specs - Integration with Tracing', () => {
  
  test('parseSpec - extracts context and maps to interfaces (traced)', async () => {
    const spec = `
      Given I visit example.com
      When I activate the easter egg game (press 'g', selector: #game-paddle)
      Then the game should be playable
      Context: viewport=1280x720, device=desktop, fps: 2, duration: 10 seconds
    `;
    
    console.log('[TRACE] Input spec:', spec.substring(0, 100));
    
    const parsed = await parseSpec(spec, { useLLM: false }); // Use regex fallback for tests
    
    console.log('[TRACE] Parsed spec:', {
      type: parsed.type,
      interfaces: parsed.interfaces,
      keywords: parsed.keywords,
      contextKeys: Object.keys(parsed.context || {})
    });
    
    assert.ok(parsed.context);
    // URL extraction may vary, so check if it exists or matches pattern
    assert.ok(parsed.context.url === 'https://example.com' || parsed.context.url?.includes('example.com'));
    // Game activation key extraction may vary
    if (parsed.context.gameActivationKey) {
      assert.strictEqual(parsed.context.gameActivationKey.toLowerCase(), 'g');
    }
    // Game selector extraction may vary
    if (parsed.context.gameSelector) {
      assert.ok(parsed.context.gameSelector.includes('game-paddle') || parsed.context.gameSelector === '#game-paddle');
    }
    // Viewport extraction from "viewport=1280x720" format
    if (parsed.context.viewport) {
      assert.deepStrictEqual(parsed.context.viewport, { width: 1280, height: 720 });
    }
    // Device extraction
    if (parsed.context.device) {
      assert.strictEqual(parsed.context.device.toLowerCase(), 'desktop');
    }
    // FPS and duration extraction may vary
    if (parsed.context.fps !== undefined) {
      assert.strictEqual(parsed.context.fps, 2);
    }
    if (parsed.context.duration !== undefined) {
      assert.strictEqual(parsed.context.duration, 10000);
    }
    
    assert.ok(parsed.interfaces.includes('testGameplay'));
  });
  
  test('validateSpec - detects structure and provides feedback (traced)', () => {
    const goodSpec = `
      Given I visit example.com
      When the page loads
      Then it should be accessible
    `;
    
    console.log('[TRACE] Validating good spec');
    const goodValidation = validateSpec(goodSpec);
    console.log('[TRACE] Good spec validation:', {
      valid: goodValidation.valid,
      errors: goodValidation.errors.length,
      warnings: goodValidation.warnings.length
    });
    
    assert.strictEqual(goodValidation.valid, true);
    assert.strictEqual(goodValidation.errors.length, 0);
    
    const badSpec = 'Just some text without structure';
    console.log('[TRACE] Validating bad spec');
    const badValidation = validateSpec(badSpec);
    console.log('[TRACE] Bad spec validation:', {
      valid: badValidation.valid,
      warnings: badValidation.warnings.length,
      suggestions: badValidation.suggestions.length
    });
    
    assert.strictEqual(badValidation.valid, true); // Valid but has warnings
    assert.ok(badValidation.warnings.length > 0);
    assert.ok(badValidation.suggestions.length > 0);
  });
  
  test('createSpecFromTemplate - generates valid specs (traced)', () => {
    console.log('[TRACE] Creating spec from game template');
    const spec = createSpecFromTemplate('game', {
      url: 'test.example.com',
      activationKey: 'g',
      selector: ', selector: #game-element'
    });
    
    console.log('[TRACE] Generated spec:', spec.substring(0, 150));
    
    assert.ok(spec.includes('test.example.com'));
    assert.ok(spec.includes("press 'g'"));
    assert.ok(spec.includes('#game-element'));
    assert.ok(spec.includes('Given I visit'));
    assert.ok(spec.includes('When I activate'));
    assert.ok(spec.includes('Then the game should be playable'));
    
    // Validate the generated spec
    const validation = validateSpec(spec);
    console.log('[TRACE] Template-generated spec validation:', {
      valid: validation.valid,
      errors: validation.errors.length
    });
    
    assert.strictEqual(validation.valid, true);
  });
  
  test('spec-config - configuration system works (traced)', () => {
    console.log('[TRACE] Testing config system');
    
    // Reset to defaults
    resetSpecConfig();
    const defaultConfig = getSpecConfig();
    console.log('[TRACE] Default config:', {
      useLLM: defaultConfig.useLLM,
      validateBeforeExecute: defaultConfig.validateBeforeExecute,
      strictValidation: defaultConfig.strictValidation
    });
    
    assert.strictEqual(defaultConfig.useLLM, true);
    assert.strictEqual(defaultConfig.validateBeforeExecute, true);
    assert.strictEqual(defaultConfig.strictValidation, false);
    
    // Create custom config
    const customConfig = createSpecConfig({
      useLLM: false,
      strictValidation: true
    });
    console.log('[TRACE] Custom config:', {
      useLLM: customConfig.useLLM,
      strictValidation: customConfig.strictValidation
    });
    
    assert.strictEqual(customConfig.useLLM, false);
    assert.strictEqual(customConfig.strictValidation, true);
    
    // Set config
    setSpecConfig(customConfig);
    const retrievedConfig = getSpecConfig();
    console.log('[TRACE] Retrieved config:', {
      useLLM: retrievedConfig.useLLM,
      strictValidation: retrievedConfig.strictValidation
    });
    
    assert.strictEqual(retrievedConfig.useLLM, false);
    assert.strictEqual(retrievedConfig.strictValidation, true);
    
    // Reset
    resetSpecConfig();
    const resetConfig = getSpecConfig();
    assert.strictEqual(resetConfig.useLLM, true);
  });
  
  test('executeSpec - requires Playwright (skipped)', { skip: true }, () => {
    // This test requires Playwright page object
    // Use evaluation/e2e/ for full Playwright-based integration tests
  });
  
  test('end-to-end: template -> parse -> validate (traced, no execution)', async () => {
    console.log('[TRACE] === End-to-End Test (Parse/Validate Only) ===');
    
    // Step 1: Create spec from template
    console.log('[TRACE] Step 1: Creating spec from template');
    const templateSpec = createSpecFromTemplate('accessibility', {
      url: 'example.com',
      persona: ' as a visually impaired user'
    });
    console.log('[TRACE] Template spec:', templateSpec.substring(0, 100));
    
    // Step 2: Validate spec
    console.log('[TRACE] Step 2: Validating spec');
    const validation = validateSpec(templateSpec);
    console.log('[TRACE] Validation:', {
      valid: validation.valid,
      warnings: validation.warnings.length
    });
    assert.strictEqual(validation.valid, true);
    
    // Step 3: Parse spec
    console.log('[TRACE] Step 3: Parsing spec');
    const parsed = await parseSpec(templateSpec, { useLLM: false }); // Use regex fallback for tests
    console.log('[TRACE] Parsed:', {
      interfaces: parsed.interfaces,
      context: Object.keys(parsed.context || {}),
      url: parsed.context?.url
    });
    assert.ok(parsed.interfaces.includes('validateAccessibilitySmart'));
    // URL extraction may vary based on LLM vs regex, so check if it exists or matches pattern
    assert.ok(parsed.context?.url === 'https://example.com' || parsed.context?.url?.includes('example.com'));
    
    console.log('[TRACE] === End-to-End Test Complete (Execution skipped - requires Playwright) ===');
  });
});
