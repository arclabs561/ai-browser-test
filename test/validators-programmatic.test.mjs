/**
 * Programmatic Validators Test
 * 
 * Tests for programmatic validators: accessibility-programmatic and state-programmatic
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  getContrastRatio,
  checkElementContrast,
  checkAllTextContrast,
  checkKeyboardNavigation,
  validateStateProgrammatic,
  validateElementPosition
} from '../src/validators/index.mjs';
import { ValidationError } from '../src/errors.mjs';

test('getContrastRatio - black on white', () => {
  const ratio = getContrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
  assert.ok(ratio >= 20, `Expected ratio >= 20, got ${ratio}`);
});

test('getContrastRatio - white on black', () => {
  const ratio = getContrastRatio('rgb(255, 255, 255)', 'rgb(0, 0, 0)');
  assert.ok(ratio >= 20, `Expected ratio >= 20, got ${ratio}`);
});

test('getContrastRatio - same color', () => {
  const ratio = getContrastRatio('rgb(100, 100, 100)', 'rgb(100, 100, 100)');
  assert.equal(ratio, 1.0);
});

test('getContrastRatio - hex format', () => {
  const ratio = getContrastRatio('#000000', '#ffffff');
  assert.ok(ratio >= 20, `Expected ratio >= 20, got ${ratio}`);
});

test('getContrastRatio - short hex format', () => {
  const ratio = getContrastRatio('#000', '#fff');
  assert.ok(ratio >= 20, `Expected ratio >= 20, got ${ratio}`);
});

test('checkElementContrast - invalid page', async () => {
  await assert.rejects(
    () => checkElementContrast(null, '#test', 4.5),
    ValidationError
  );
});

test('checkElementContrast - invalid selector', async () => {
  const mockPage = {
    evaluate: async () => ({ error: 'Element not found' })
  };
  
  await assert.rejects(
    () => checkElementContrast(mockPage, null, 4.5),
    ValidationError
  );
});

test('checkElementContrast - invalid minRatio', async () => {
  const mockPage = {
    evaluate: async () => ({ ratio: 4.5, passes: true })
  };
  
  await assert.rejects(
    () => checkElementContrast(mockPage, '#test', -1),
    ValidationError
  );
  
  await assert.rejects(
    () => checkElementContrast(mockPage, '#test', 22),
    ValidationError
  );
});

test('checkAllTextContrast - invalid page', async () => {
  await assert.rejects(
    () => checkAllTextContrast(null, 4.5),
    ValidationError
  );
});

test('checkAllTextContrast - invalid minRatio', async () => {
  const mockPage = {
    evaluate: async () => ({ total: 0, passing: 0, failing: 0, violations: [] })
  };
  
  await assert.rejects(
    () => checkAllTextContrast(mockPage, -1),
    ValidationError
  );
});

test('checkKeyboardNavigation - invalid page', async () => {
  await assert.rejects(
    () => checkKeyboardNavigation(null),
    ValidationError
  );
});

test('validateStateProgrammatic - invalid page', async () => {
  await assert.rejects(
    () => validateStateProgrammatic(null, { test: 'value' }),
    ValidationError
  );
});

test('validateStateProgrammatic - invalid expectedState', async () => {
  const mockPage = {
    evaluate: async () => ({})
  };
  
  await assert.rejects(
    () => validateStateProgrammatic(mockPage, null),
    ValidationError
  );
});

test('validateStateProgrammatic - invalid tolerance', async () => {
  const mockPage = {
    evaluate: async () => ({})
  };
  
  await assert.rejects(
    () => validateStateProgrammatic(mockPage, { test: 'value' }, { tolerance: -1 }),
    ValidationError
  );
});

test('validateElementPosition - invalid page', async () => {
  await assert.rejects(
    () => validateElementPosition(null, '#test', { x: 100, y: 200 }),
    ValidationError
  );
});

test('validateElementPosition - invalid selector', async () => {
  const mockPage = {
    evaluate: async () => null
  };
  
  await assert.rejects(
    () => validateElementPosition(mockPage, null, { x: 100, y: 200 }),
    ValidationError
  );
});

test('validateElementPosition - invalid expectedPosition', async () => {
  const mockPage = {
    evaluate: async () => ({ x: 100, y: 200 })
  };
  
  await assert.rejects(
    () => validateElementPosition(mockPage, '#test', null),
    ValidationError
  );
});

test('validateElementPosition - invalid tolerance', async () => {
  const mockPage = {
    evaluate: async () => ({ x: 100, y: 200 })
  };
  
  await assert.rejects(
    () => validateElementPosition(mockPage, '#test', { x: 100, y: 200 }, -1),
    ValidationError
  );
});

