import { describe, it } from 'node:test';
import assert from 'node:assert';
import { comparePair, rankBatch } from '../src/pair-comparison.mjs';
import { VLLMJudge } from '../src/judge.mjs';
import { createConfig } from '../src/config.mjs';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

// Helper to create minimal test PNG
function createTestImage(path) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  writeFileSync(path, minimalPng);
}

// Helper to cleanup
function cleanup(paths) {
  for (const path of paths) {
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {}
    }
  }
}

describe('Pair Comparison - Multi-Image Support', () => {
  it('should support true multi-image comparison', async () => {
    const config = createConfig();
    if (!config.enabled) {
      // Skip if no API key
      return;
    }
    
    const tempDir = join(tmpdir(), `pair-test-${Date.now()}`);
    const img1 = join(tempDir, 'img1.png');
    const img2 = join(tempDir, 'img2.png');
    
    try {
      createTestImage(img1);
      createTestImage(img2);
      
      const result = await comparePair(img1, img2, 'Compare these screenshots', {});
      
      assert.ok(result !== undefined);
      if (result.enabled) {
        assert.ok(['A', 'B', 'tie'].includes(result.winner));
        assert.ok(typeof result.confidence === 'number');
        assert.ok(result.comparison);
        assert.strictEqual(result.comparison.method, 'multi-image');
      }
    } finally {
      cleanup([img1, img2]);
    }
  });
  
  it('should handle disabled API gracefully', async () => {
    const tempDir = join(tmpdir(), `pair-test-${Date.now()}`);
    const img1 = join(tempDir, 'img1.png');
    const img2 = join(tempDir, 'img2.png');
    
    try {
      createTestImage(img1);
      createTestImage(img2);
      
      // Force disabled config
      const result = await comparePair(img1, img2, 'Compare', {
        apiKey: null,
        provider: 'gemini'
      });
      
      assert.strictEqual(result.enabled, false);
      assert.strictEqual(result.winner, null);
    } finally {
      cleanup([img1, img2]);
    }
  });
  
  it('should parse structured comparison JSON', async () => {
    // Test that we can parse winner, scores, confidence from JSON
    const mockJudgment = `Here's my comparison:
{
  "winner": "A",
  "confidence": 0.8,
  "reasoning": "Screenshot A is better",
  "differences": ["better contrast", "clearer layout"],
  "scores": {"A": 8, "B": 6}
}`;
    
    const jsonMatch = mockJudgment.match(/\{[\s\S]*\}/);
    assert.ok(jsonMatch);
    const parsed = JSON.parse(jsonMatch[0]);
    assert.strictEqual(parsed.winner, 'A');
    assert.strictEqual(parsed.confidence, 0.8);
    assert.ok(Array.isArray(parsed.differences));
  });
});

describe('Rank Batch', () => {
  it('should rank multiple screenshots', async () => {
    const config = createConfig();
    if (!config.enabled) {
      return;
    }
    
    const tempDir = join(tmpdir(), `rank-test-${Date.now()}`);
    const images = [
      join(tempDir, 'img1.png'),
      join(tempDir, 'img2.png'),
      join(tempDir, 'img3.png')
    ];
    
    try {
      for (const img of images) {
        createTestImage(img);
      }
      
      const result = await rankBatch(images, 'Rank these screenshots', {});
      
      assert.ok(result !== undefined);
      if (result.enabled) {
        assert.ok(Array.isArray(result.rankings));
        assert.ok(result.rankings.length > 0);
      }
    } finally {
      cleanup(images);
    }
  });
  
  it('should handle empty array', async () => {
    const result = await rankBatch([], 'test', {});
    assert.strictEqual(result.enabled, false);
    assert.ok(result.error);
  });
});


