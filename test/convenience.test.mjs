/**
 * Tests for high-level convenience functions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  testGameplay,
  testBrowserExperience,
  validateWithGoals,
  generateGamePrompt,
  createGameGoal
} from '../src/index.mjs';
import { createMockPage } from './helpers/mock-page.mjs';
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

describe('Convenience Functions', () => {
  describe('validateWithGoals', () => {
    it('should validate with string goal', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        const result = await validateWithGoals(screenshotPath, {
          goal: 'Is the game fun?'
        });

        assert.ok(result);
        assert.strictEqual(result.goal, 'Is the game fun?');
        assert.ok(result.prompt);
        assert.ok(result.result);
        assert.ok('enabled' in result.result);
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });

    it('should validate with goal object', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        const goal = createGameGoal('accessibility');
        const result = await validateWithGoals(screenshotPath, {
          goal,
          gameState: { gameActive: true, score: 100 }
        });

        assert.ok(result);
        assert.strictEqual(result.goal, 'Evaluate game accessibility');
        assert.ok(result.prompt);
        assert.ok(result.result);
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });

    it('should validate with goal array', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        const goals = ['Is it fun?', 'Is it accessible?'];
        const result = await validateWithGoals(screenshotPath, {
          goal: goals
        });

        assert.ok(result);
        assert.ok(result.prompt);
        assert.ok(result.prompt.includes('EVALUATE THE FOLLOWING GOALS'));
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });

    it('should throw error if screenshotPath missing', async () => {
      try {
        await validateWithGoals(null, { goal: 'test' });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('screenshotPath is required'));
      }
    });

    it('should throw error if goal missing', async () => {
      const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
      const screenshotPath = join(tempDir, 'test.png');
      createTempImage(screenshotPath);

      try {
        await validateWithGoals(screenshotPath, {});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('goal is required'));
      } finally {
        if (existsSync(screenshotPath)) {
          unlinkSync(screenshotPath);
        }
      }
    });
  });

  describe('generateGamePrompt', () => {
    it('should generate prompt from string', () => {
      const prompt = generateGamePrompt('Is the game fun?', {
        gameState: { score: 100 }
      });

      assert.ok(typeof prompt === 'string');
      assert.ok(prompt.includes('Is the game fun?'));
      assert.ok(prompt.includes('CURRENT GAME STATE'));
    });

    it('should generate prompt from goal object', () => {
      const goal = createGameGoal('fun');
      const prompt = generateGamePrompt(goal, {
        gameState: { gameActive: true }
      });

      assert.ok(typeof prompt === 'string');
      assert.ok(prompt.includes('GOAL:'));
      assert.ok(prompt.includes('Evaluate if the game is fun'));
    });

    it('should generate prompt from goal array', () => {
      const goals = ['Is it fun?', 'Is it accessible?'];
      const prompt = generateGamePrompt(goals, {
        gameState: { score: 100 }
      });

      assert.ok(typeof prompt === 'string');
      assert.ok(prompt.includes('EVALUATE THE FOLLOWING GOALS'));
    });
  });

  describe('testGameplay', () => {
    it('should throw error if url missing', async () => {
      const mockPage = createMockPage();
      try {
        await testGameplay(mockPage, {});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('url is required'));
      }
    });

    it('should handle basic gameplay test', async () => {
      const mockPage = createMockPage({
        html: '<html><body><canvas id="game"></canvas></body></html>',
        gameState: { gameActive: true, score: 0 }
      });

      const result = await testGameplay(mockPage, {
        url: 'about:blank',
        goals: ['fun'],
        captureTemporal: false,
        captureCode: false
      });

      assert.ok(result);
      assert.strictEqual(result.url, 'about:blank');
      assert.ok(Array.isArray(result.goals));
      assert.ok(Array.isArray(result.experiences));
    });
  });

  describe('testBrowserExperience', () => {
    it('should throw error if url missing', async () => {
      const mockPage = createMockPage();
      try {
        await testBrowserExperience(mockPage, {});
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('url is required'));
      }
    });

    it('should handle basic browser experience test', async () => {
      const mockPage = createMockPage();

      const result = await testBrowserExperience(mockPage, {
        url: 'about:blank',
        stages: ['initial'],
        captureCode: false
      });

      assert.ok(result);
      assert.strictEqual(result.url, 'about:blank');
      assert.ok(Array.isArray(result.stages));
      assert.ok(Array.isArray(result.experiences));
    });
  });
});

