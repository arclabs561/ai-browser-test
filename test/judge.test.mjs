/**
 * Tests for judge.mjs (VLLMJudge, validateScreenshot)
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { VLLMJudge, validateScreenshot } from '../src/judge.mjs';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Create test-results directory
const testResultsDir = join(process.cwd(), 'test-results');
if (!existsSync(testResultsDir)) {
  mkdirSync(testResultsDir, { recursive: true });
}

// Create a mock screenshot file
function createMockScreenshot() {
  const path = join(testResultsDir, `test-${Date.now()}.png`);
  // Create a minimal PNG file (1x1 pixel)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // More PNG data
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
  ]);
  writeFileSync(path, pngData);
  return path;
}

describe('VLLMJudge', () => {
  let judge;
  let screenshotPath;

  beforeEach(() => {
    // Create judge without API keys (disabled mode)
    judge = new VLLMJudge({
      provider: 'gemini',
      apiKey: undefined,
      cacheEnabled: false
    });
    screenshotPath = createMockScreenshot();
  });

  afterEach(() => {
    if (screenshotPath && existsSync(screenshotPath)) {
      unlinkSync(screenshotPath);
    }
  });

  it('should create VLLMJudge instance', () => {
    assert.ok(judge instanceof VLLMJudge);
    assert.strictEqual(judge.provider, 'gemini');
    assert.strictEqual(judge.enabled, false);
  });

  it('should convert image to base64', () => {
    const base64 = judge.imageToBase64(screenshotPath);
    assert.ok(typeof base64 === 'string');
    assert.ok(base64.length > 0);
  });

  it('should throw error for non-existent image', () => {
    assert.throws(() => {
      judge.imageToBase64('/nonexistent/image.png');
    }, /Screenshot not found/);
  });

  it('should return disabled result when API key not set', async () => {
    const result = await judge.judgeScreenshot(
      screenshotPath,
      'Test prompt',
      { testType: 'unit-test' }
    );
    
    assert.strictEqual(result.enabled, false);
    assert.strictEqual(result.provider, 'gemini');
    assert.ok(result.message.includes('disabled'));
  });

  it('should build prompt with context', () => {
    const prompt = judge.buildPrompt('Base prompt', {
      testType: 'payment-screen',
      viewport: { width: 1280, height: 720 }
    });
    
    assert.ok(prompt.includes('Base prompt'));
    assert.ok(prompt.includes('payment-screen'));
  });

  it('should extract semantic info from judgment', () => {
    const judgment = 'Score: 8/10. Issues: None. Assessment: Good.';
    const info = judge.extractSemanticInfo(judgment);
    
    assert.ok(typeof info === 'object');
    assert.ok('score' in info);
    assert.ok('issues' in info);
    assert.ok('assessment' in info);
    assert.ok('reasoning' in info);
  });
});

describe('validateScreenshot', () => {
  let screenshotPath;

  beforeEach(() => {
    screenshotPath = createMockScreenshot();
  });

  afterEach(() => {
    if (screenshotPath && existsSync(screenshotPath)) {
      unlinkSync(screenshotPath);
    }
  });

  it('should validate screenshot without API key', async () => {
    const result = await validateScreenshot(
      screenshotPath,
      'Test prompt',
      { testType: 'unit-test' }
    );
    
    assert.ok(typeof result === 'object');
    assert.strictEqual(result.enabled, false);
  });

  it('should accept context options', async () => {
    const result = await validateScreenshot(
      screenshotPath,
      'Test prompt',
      {
        testType: 'payment-screen',
        viewport: { width: 1280, height: 720 },
        useCache: false
      }
    );
    
    assert.ok(typeof result === 'object');
  });
});

