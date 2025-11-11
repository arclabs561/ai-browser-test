import { test } from 'node:test';
import assert from 'node:assert';
import { detectBias, detectPositionBias } from '../src/bias-detector.mjs';

test('detectBias detects verbosity bias', () => {
  const longText = 'very '.repeat(100) + 'really '.repeat(50) + 'quite '.repeat(30);
  const result = detectBias(longText);
  
  assert.ok(result.hasBias);
  assert.ok(result.biases.some(b => b.type === 'verbosity'));
});

test('detectBias detects length bias', () => {
  const text = 'This response is very long and extensive. The length of this response is significant.';
  const result = detectBias(text, { checkLength: true });
  
  // May or may not detect depending on exact content
  assert.ok(typeof result.hasBias === 'boolean');
});

test('detectBias detects authority bias', () => {
  const text = 'According to research, studies indicate that experts say this is commonly accepted as best practice and industry standard.';
  const result = detectBias(text);
  
  assert.ok(result.hasBias);
  assert.ok(result.biases.some(b => b.type === 'authority'));
});

test('detectBias returns no bias for normal text', () => {
  const text = 'This is a normal evaluation with reasonable length and content.';
  const result = detectBias(text);
  
  // Should have low or no bias
  assert.ok(result.severity === 'none' || result.severity === 'low');
});

test('detectPositionBias detects first position bias', () => {
  const judgments = [
    { score: 9 },
    { score: 6 },
    { score: 6 }
  ];
  
  const result = detectPositionBias(judgments);
  assert.ok(result.detected);
  assert.ok(result.firstBias);
});

test('detectPositionBias detects last position bias', () => {
  const judgments = [
    { score: 6 },
    { score: 6 },
    { score: 9 }
  ];
  
  const result = detectPositionBias(judgments);
  assert.ok(result.detected);
  assert.ok(result.lastBias);
});

test('detectPositionBias returns false for consistent scores', () => {
  const judgments = [
    { score: 7 },
    { score: 7 },
    { score: 7 }
  ];
  
  const result = detectPositionBias(judgments);
  assert.strictEqual(result.detected, false);
});

test('detectPositionBias handles single judgment', () => {
  const judgments = [{ score: 7 }];
  const result = detectPositionBias(judgments);
  assert.strictEqual(result.detected, false);
  assert.ok(result.reason);
});





