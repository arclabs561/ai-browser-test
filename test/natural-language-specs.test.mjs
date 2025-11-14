/**
 * Natural Language Specifications Tests
 * 
 * Tests for natural language spec parsing, context extraction, and execution.
 * Based on queeraoke real-world usage patterns.
 * 
 * Note: Tests requiring Playwright page object are skipped in Node test runner.
 * Use evaluation/e2e/ for full Playwright-based integration tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseSpec, validateSpec } from '../src/natural-language-specs.mjs';

describe('Natural Language Specs', () => {
  
  test('parseSpec - extracts context from spec text', async () => {
    const spec = `
      Given I visit queeraoke.fyi
      When I activate the easter egg game (press 'g', selector: #game-paddle)
      Then the game should be playable
      Context: viewport=1280x720, device=desktop, fps: 2, duration: 10 seconds
    `;
    
    // Use regex fallback for tests (no API key required)
    const parsed = await parseSpec(spec, { useLLM: false });
    
    assert.ok(parsed.context);
    assert.strictEqual(parsed.context.url, 'https://queeraoke.fyi');
    assert.strictEqual(parsed.context.gameActivationKey, 'g');
    assert.strictEqual(parsed.context.gameSelector, '#game-paddle');
    assert.deepStrictEqual(parsed.context.viewport, { width: 1280, height: 720 });
    assert.strictEqual(parsed.context.device, 'desktop');
    assert.strictEqual(parsed.context.fps, 2);
    assert.strictEqual(parsed.context.duration, 10000); // 10 seconds in ms
  });
  
  test('parseSpec - extracts URL from various patterns', async () => {
    const patterns = [
      'Given I visit queeraoke.fyi',
      'When I open https://queeraoke.fyi',
      'Navigate to queeraoke.fyi',
      'Go to https://example.com/game'
    ];
    
    for (const pattern of patterns) {
      const parsed = await parseSpec(pattern);
      assert.ok(parsed.context.url);
      assert.ok(/^https?:\/\//.test(parsed.context.url));
    }
  });
  
  test('parseSpec - extracts game activation key', async () => {
    const specs = [
      "When I press 'g'",
      "Press key: g",
      "Activation key: g",
      "When I use Konami code"
    ];
    
    for (const spec of specs) {
      const parsed = await parseSpec(spec);
      if (spec.includes('Konami')) {
        assert.strictEqual(parsed.context.gameActivationKey, 'konami');
      } else {
        assert.strictEqual(parsed.context.gameActivationKey, 'g');
      }
    }
  });
  
  test('parseSpec - detects interfaces from keywords', async () => {
    const spec = `
      Given I visit a game website
      When I play the game
      Then it should be accessible
      And the game state should be consistent
    `;
    
    const parsed = await parseSpec(spec);
    
    assert.ok(parsed.interfaces.includes('testGameplay'));
    assert.ok(parsed.interfaces.includes('validateAccessibilitySmart'));
    assert.ok(parsed.interfaces.includes('validateStateSmart'));
  });
  
  test('validateSpec - detects structure issues', () => {
    const spec1 = 'Just some text without structure';
    const validation1 = validateSpec(spec1);
    
    assert.strictEqual(validation1.valid, true); // Valid but has warnings
    assert.ok(validation1.warnings.length > 0);
    assert.ok(validation1.suggestions.length > 0);
    
    const spec2 = `
      Given I visit queeraoke.fyi
      When I activate the game
      Then the game should be playable
    `;
    const validation2 = validateSpec(spec2);
    
    assert.strictEqual(validation2.valid, true);
    assert.strictEqual(validation2.errors.length, 0);
  });
  
  test('validateSpec - detects missing URL', () => {
    const spec = 'Given I do something, Then something should happen';
    const validation = validateSpec(spec);
    
    assert.ok(validation.warnings.some(w => w.includes('URL')));
  });
  
  test('executeSpec - requires Playwright (skipped)', { skip: true }, () => {
    // executeSpec tests require Playwright page object
    // Use evaluation/e2e/ for full Playwright-based integration tests
  });
});
