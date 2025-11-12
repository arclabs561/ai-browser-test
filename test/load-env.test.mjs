/**
 * Tests for load-env.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadEnv } from '../src/load-env.mjs';

const TEST_DIR = join(tmpdir(), 'ai-visual-test-load-env');

test.beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    try {
      rmdirSync(TEST_DIR, { recursive: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  mkdirSync(TEST_DIR, { recursive: true });
});

test.afterEach(() => {
  if (existsSync(TEST_DIR)) {
    try {
      const envFile = join(TEST_DIR, '.env');
      if (existsSync(envFile)) {
        unlinkSync(envFile);
      }
      rmdirSync(TEST_DIR, { recursive: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
});

test('loadEnv - returns false when no .env file', () => {
  const result = loadEnv(TEST_DIR);
  assert.strictEqual(result, false);
});

test('loadEnv - loads .env file', () => {
  const envFile = join(TEST_DIR, '.env');
  writeFileSync(envFile, 'TEST_KEY=test_value\nTEST_KEY2=test_value2');
  
  const originalValue = process.env.TEST_KEY;
  delete process.env.TEST_KEY;
  
  try {
    const result = loadEnv(TEST_DIR);
    assert.strictEqual(result, true);
    assert.strictEqual(process.env.TEST_KEY, 'test_value');
    assert.strictEqual(process.env.TEST_KEY2, 'test_value2');
  } finally {
    if (originalValue) {
      process.env.TEST_KEY = originalValue;
    } else {
      delete process.env.TEST_KEY;
    }
    delete process.env.TEST_KEY2;
  }
});

test('loadEnv - skips comments', () => {
  const envFile = join(TEST_DIR, '.env');
  writeFileSync(envFile, '# This is a comment\nTEST_KEY=test_value');
  
  const originalValue = process.env.TEST_KEY;
  delete process.env.TEST_KEY;
  
  try {
    const result = loadEnv(TEST_DIR);
    assert.strictEqual(result, true);
    assert.strictEqual(process.env.TEST_KEY, 'test_value');
  } finally {
    if (originalValue) {
      process.env.TEST_KEY = originalValue;
    } else {
      delete process.env.TEST_KEY;
    }
  }
});

test('loadEnv - removes quotes', () => {
  const envFile = join(TEST_DIR, '.env');
  writeFileSync(envFile, 'TEST_KEY="quoted_value"\nTEST_KEY2=\'single_quoted\'');
  
  const originalValue = process.env.TEST_KEY;
  delete process.env.TEST_KEY;
  delete process.env.TEST_KEY2;
  
  try {
    const result = loadEnv(TEST_DIR);
    assert.strictEqual(result, true);
    assert.strictEqual(process.env.TEST_KEY, 'quoted_value');
    assert.strictEqual(process.env.TEST_KEY2, 'single_quoted');
  } finally {
    if (originalValue) {
      process.env.TEST_KEY = originalValue;
    } else {
      delete process.env.TEST_KEY;
    }
    delete process.env.TEST_KEY2;
  }
});

test('loadEnv - respects existing env vars', () => {
  const envFile = join(TEST_DIR, '.env');
  writeFileSync(envFile, 'TEST_KEY=env_file_value');
  
  process.env.TEST_KEY = 'existing_value';
  
  try {
    const result = loadEnv(TEST_DIR);
    assert.strictEqual(result, true);
    assert.strictEqual(process.env.TEST_KEY, 'existing_value'); // Should not override
  } finally {
    delete process.env.TEST_KEY;
  }
});

