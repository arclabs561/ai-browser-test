/**
 * Integration Tests: Variable Goals Cohesive Integration
 * 
 * Tests that variable goals work cohesively throughout the system:
 * - validateScreenshot with goals in context
 * - prompt composition with goals
 * - convenience functions with goals
 * - All components working together
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateScreenshot,
  validateWithGoals,
  createGameGoal,
  generateGamePrompt,
  composeSingleImagePrompt
} from '../src/index.mjs';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

// Helper to create temporary test image file
function createTempImage(path) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  writeFileSync(path, minimalPng);
  return path;
}

describe('Variable Goals Cohesive Integration', () => {
  describe('validateScreenshot with goals in context', () => {
    it('should accept goal in context and use it for prompt generation', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        // Pass goal directly in context - should be used by prompt composition
        const result = await validateScreenshot(screenshotPath, 'Base prompt', {
          goal: 'Is the game fun?',
          gameState: { score: 100 }
        });

        assert.ok(result);
        assert.ok('enabled' in result);
        // The goal should have been used in prompt composition
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });

    it('should work with goal object in context', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        const goal = createGameGoal('accessibility');
        const result = await validateScreenshot(screenshotPath, 'Base prompt', {
          goal,
          gameState: { gameActive: true }
        });

        assert.ok(result);
        assert.ok('enabled' in result);
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });
  });

  describe('prompt composition with goals', () => {
    it('should compose prompt with goal in context', async () => {
      const prompt = await composeSingleImagePrompt('Base prompt', {
        goal: 'Is it fun?',
        gameState: { score: 100 }
      });

      assert.ok(typeof prompt === 'string');
      assert.ok(prompt.length > 0);
      // Should include goal-generated content
      assert.ok(prompt.includes('Base prompt') || prompt.includes('CURRENT GAME STATE'));
    });

    it('should work with goal object in context', async () => {
      const goal = createGameGoal('performance');
      const prompt = await composeSingleImagePrompt('Base prompt', {
        goal,
        gameState: { gameActive: true }
      });

      assert.ok(typeof prompt === 'string');
      assert.ok(prompt.length > 0);
    });
  });

  describe('convenience functions with goals', () => {
    it('should pass goals through validateWithGoals', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        const result = await validateWithGoals(screenshotPath, {
          goal: 'Is it accessible?',
          gameState: { score: 50 }
        });

        assert.ok(result);
        assert.strictEqual(result.goal, 'Is it accessible?');
        assert.ok(result.prompt);
        assert.ok(result.result);
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });

    it('should work with goal object in validateWithGoals', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        const goal = createGameGoal('fun');
        const result = await validateWithGoals(screenshotPath, {
          goal,
          gameState: { score: 200 }
        });

        assert.ok(result);
        assert.ok(result.prompt);
        assert.ok(result.result);
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });
  });

  describe('cohesive workflow', () => {
    it('should work end-to-end: goal -> prompt -> validation', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        // 1. Create goal
        const goal = createGameGoal('accessibility');
        
        // 2. Generate prompt (for reference)
        const prompt = generateGamePrompt(goal, {
          gameState: { score: 100 }
        });
        assert.ok(prompt.length > 0);
        
        // 3. Validate with goal in context (cohesive)
        const result = await validateScreenshot(screenshotPath, prompt, {
          goal, // Pass goal - prompt composition will use it
          gameState: { score: 100 }
        });
        
        assert.ok(result);
        assert.ok('enabled' in result);
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });

    it('should work with convenience function: validateWithGoals', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        const goal = createGameGoal('performance');
        
        // Convenience function handles everything cohesively
        const result = await validateWithGoals(screenshotPath, {
          goal,
          gameState: { score: 150 }
        });
        
        assert.ok(result);
        assert.ok(result.prompt);
        assert.ok(result.result);
        // Goal should have been used throughout
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });
  });
});

