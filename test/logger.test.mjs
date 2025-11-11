import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  enableDebug,
  disableDebug,
  isDebugEnabled,
  warn,
  log,
  error
} from '../src/logger.mjs';

describe('Logger', () => {
  test('enableDebug enables debug mode', () => {
    disableDebug(); // Reset to known state
    enableDebug();
    assert.strictEqual(isDebugEnabled(), true);
  });

  test('disableDebug disables debug mode', () => {
    enableDebug();
    disableDebug();
    assert.strictEqual(isDebugEnabled(), false);
  });

  test('isDebugEnabled returns current state', () => {
    disableDebug();
    assert.strictEqual(isDebugEnabled(), false);
    
    enableDebug();
    assert.strictEqual(isDebugEnabled(), true);
  });

  test('warn does not throw', () => {
    disableDebug();
    assert.doesNotThrow(() => warn('Test warning'));
    
    enableDebug();
    assert.doesNotThrow(() => warn('Test warning'));
  });

  test('log does not throw', () => {
    disableDebug();
    assert.doesNotThrow(() => log('Test log'));
    
    enableDebug();
    assert.doesNotThrow(() => log('Test log'));
  });

  test('error does not throw', () => {
    disableDebug();
    assert.doesNotThrow(() => error('Test error'));
    
    enableDebug();
    assert.doesNotThrow(() => error('Test error'));
  });

  test('logger functions accept multiple arguments', () => {
    disableDebug();
    assert.doesNotThrow(() => warn('Message', { key: 'value' }, 123));
    assert.doesNotThrow(() => log('Message', { key: 'value' }, 123));
    assert.doesNotThrow(() => error('Message', { key: 'value' }, 123));
  });
});


