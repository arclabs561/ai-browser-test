import { test } from 'node:test';
import assert from 'node:assert';
import {
  AIBrowserTestError,
  ValidationError,
  CacheError,
  ConfigError,
  ProviderError,
  TimeoutError,
  FileError,
  isAIBrowserTestError,
  isErrorType
} from '../src/index.mjs';

test('AIBrowserTestError - basic functionality', () => {
  const error = new AIBrowserTestError('Test error', 'TEST_ERROR', { detail: 'test' });
  
  assert.strictEqual(error.message, 'Test error');
  assert.strictEqual(error.code, 'TEST_ERROR');
  assert.deepStrictEqual(error.details, { detail: 'test' });
  assert.strictEqual(error.name, 'AIBrowserTestError');
  assert(error.stack);
});

test('AIBrowserTestError - toJSON', () => {
  const error = new AIBrowserTestError('Test error', 'TEST_ERROR', { detail: 'test' });
  const json = error.toJSON();
  
  assert.strictEqual(json.name, 'AIBrowserTestError');
  assert.strictEqual(json.code, 'TEST_ERROR');
  assert.strictEqual(json.message, 'Test error');
  assert.deepStrictEqual(json.details, { detail: 'test' });
  assert(json.stack);
});

test('ValidationError', () => {
  const error = new ValidationError('Validation failed', { field: 'test' });
  
  assert.strictEqual(error.message, 'Validation failed');
  assert.strictEqual(error.code, 'VALIDATION_ERROR');
  assert.deepStrictEqual(error.details, { field: 'test' });
  assert.strictEqual(error.name, 'ValidationError');
});

test('CacheError', () => {
  const error = new CacheError('Cache failed', { key: 'test' });
  
  assert.strictEqual(error.message, 'Cache failed');
  assert.strictEqual(error.code, 'CACHE_ERROR');
  assert.deepStrictEqual(error.details, { key: 'test' });
});

test('ConfigError', () => {
  const error = new ConfigError('Config invalid', { option: 'test' });
  
  assert.strictEqual(error.message, 'Config invalid');
  assert.strictEqual(error.code, 'CONFIG_ERROR');
  assert.deepStrictEqual(error.details, { option: 'test' });
});

test('ProviderError', () => {
  const error = new ProviderError('Provider failed', 'gemini', { apiError: 'test' });
  
  assert.strictEqual(error.message, 'Provider failed');
  assert.strictEqual(error.code, 'PROVIDER_ERROR');
  assert.strictEqual(error.provider, 'gemini');
  assert.deepStrictEqual(error.details, { provider: 'gemini', apiError: 'test' });
});

test('TimeoutError', () => {
  const error = new TimeoutError('Operation timed out', 5000, { operation: 'test' });
  
  assert.strictEqual(error.message, 'Operation timed out');
  assert.strictEqual(error.code, 'TIMEOUT_ERROR');
  assert.strictEqual(error.timeout, 5000);
  assert.deepStrictEqual(error.details, { timeout: 5000, operation: 'test' });
});

test('FileError', () => {
  const error = new FileError('File not found', '/path/to/file', { operation: 'read' });
  
  assert.strictEqual(error.message, 'File not found');
  assert.strictEqual(error.code, 'FILE_ERROR');
  assert.strictEqual(error.filePath, '/path/to/file');
  assert.deepStrictEqual(error.details, { filePath: '/path/to/file', operation: 'read' });
});

test('isAIBrowserTestError', () => {
  const customError = new ValidationError('Test');
  const standardError = new Error('Test');
  const stringError = 'Not an error';
  
  assert.strictEqual(isAIBrowserTestError(customError), true);
  assert.strictEqual(isAIBrowserTestError(standardError), false);
  assert.strictEqual(isAIBrowserTestError(stringError), false);
  assert.strictEqual(isAIBrowserTestError(null), false);
});

test('isErrorType', () => {
  const validationError = new ValidationError('Test');
  const cacheError = new CacheError('Test');
  const standardError = new Error('Test');
  
  assert.strictEqual(isErrorType(validationError, ValidationError), true);
  assert.strictEqual(isErrorType(cacheError, ValidationError), false);
  assert.strictEqual(isErrorType(cacheError, CacheError), true);
  assert.strictEqual(isErrorType(standardError, ValidationError), false);
});

test('Error inheritance', () => {
  const error = new ValidationError('Test');
  
  assert(error instanceof AIBrowserTestError);
  assert(error instanceof ValidationError);
  assert(error instanceof Error);
});

