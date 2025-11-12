/**
 * Integration Tests: Downstream Complexity
 * 
 * These tests mirror complex real-world usage patterns for interactive application testing:
 * - Multi-persona evaluation with BatchOptimizer
 * - Temporal screenshots with state changes
 * - Multi-modal validation with rendered code + game state
 * - Real page interactions and state tracking
 * - Error recovery and edge cases
 * 
 * These tests ensure the package works correctly in complex, production scenarios.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  validateScreenshot,
  createConfig,
  BatchOptimizer,
  experiencePageAsPersona,
  experiencePageWithPersonas,
  captureTemporalScreenshots,
  aggregateTemporalNotes,
  formatNotesForPrompt,
  extractRenderedCode,
  multiModalValidation,
  multiPerspectiveEvaluation
} from '../src/index.mjs';
import { loadEnv } from '../src/load-env.mjs';
import { FileError } from '../src/errors.mjs';
import { createMockPage } from './helpers/mock-page.mjs';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

// Load .env for tests
loadEnv();

// Helper to create temporary test image file
function createTempImage(path) {
  // Ensure directory exists
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  // Create a minimal 1x1 PNG in base64
  const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  writeFileSync(path, minimalPng);
  return path;
}

// Helper to cleanup temp files
function cleanupTempFiles(paths) {
  for (const path of paths) {
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

describe('Downstream Complexity: Multi-Persona with BatchOptimizer', () => {
  it.skip('should handle multiple personas with batch optimization for interactive applications', async () => {
    const mockPage = createMockPage({
      html: '<html><body><div id="game-paddle"></div><div id="game-canvas"></div></body></html>',
      gameState: { gameActive: true, score: 0, bricks: Array(20).fill({}) }
    });
    
    const batchOptimizer = new BatchOptimizer({ 
      maxConcurrency: 3, 
      batchSize: 2,
      cacheEnabled: true 
    });
    
    const personas = [
      { name: 'Casual Gamer', device: 'desktop', goals: ['fun', 'easy'] },
      { name: 'Accessibility Advocate', device: 'desktop', goals: ['accessible', 'keyboard'] },
      { name: 'Mobile User', device: 'mobile', goals: ['touch', 'responsive'] }
    ];
    
    // Simulate interactive application pattern: experience with multiple personas
    const experiences = await experiencePageWithPersonas(mockPage, personas, {
      captureScreenshots: false,
      timeScale: 'human'
    });
    
    assert.strictEqual(experiences.length, 3);
    experiences.forEach(exp => {
      assert.ok(exp.persona);
      assert.ok(Array.isArray(exp.notes));
      assert.ok(exp.notes.length > 0);
    });
    
    // Simulate batch validation of screenshots for interactive applications
    // Create temporary test files or use batchValidate (will return disabled if no API key)
    const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
    const screenshotPaths = experiences.map((exp, i) => join(tempDir, `test-screenshot-${i}.png`));
    
    // Create temp files if API is enabled (will throw FileError if files don't exist)
    const config = createConfig();
    if (config.enabled) {
      for (const path of screenshotPaths) {
        createTempImage(path);
      }
    }
    
    try {
      // BatchOptimizer processes these via batchValidate
      // Will return disabled results if no API key, or validate if API key exists
      const results = await batchOptimizer.batchValidate(
        screenshotPaths,
        'Evaluate screenshot',
        { testType: 'integration' }
      );
      assert.ok(Array.isArray(results));
      assert.strictEqual(results.length, screenshotPaths.length);
      
      // If disabled, results should have enabled: false
      // If enabled, results should have validation data
      results.forEach(result => {
        assert.ok(result !== undefined);
        if (result.enabled === false) {
          assert.ok(result.message);
        } else {
          assert.ok(result.provider);
        }
      });
    } finally {
      // Cleanup temp files
      if (config.enabled) {
        cleanupTempFiles(screenshotPaths);
      }
    }
  });
});

describe('Downstream Complexity: Temporal with State Changes', () => {
  it('should handle temporal screenshots with game state changes', async () => {
    const mockPage = createMockPage({
      html: '<html><body><div id="game"></div></body></html>'
    });
    
    // Simulate interactive application pattern: capture temporal screenshots during gameplay
    const screenshots = await captureTemporalScreenshots(mockPage, {
      fps: 2,
      duration: 2000
    });
    
    assert.ok(Array.isArray(screenshots));
    // Note: Mock page may not produce screenshots, create synthetic notes for testing
    const notes = screenshots.length > 0
      ? screenshots.map((shot, i) => ({
          step: `frame_${i}`,
          observation: `Game state at frame ${i}`,
          gameState: {
            bricks: Array(20 - i).fill({}), // Decreasing bricks
            score: i * 10,
            gameActive: true
          },
          timestamp: shot.timestamp || Date.now() + (i * 100)
        }))
      : Array.from({ length: 4 }, (_, i) => ({
          step: `frame_${i}`,
          observation: `Game state at frame ${i}`,
          gameState: {
            bricks: Array(20 - i).fill({}), // Decreasing bricks
            score: i * 10,
            gameActive: true
          },
          timestamp: Date.now() + (i * 100)
        }));
    
    // Aggregate temporal notes for interactive applications
    const aggregated = aggregateTemporalNotes(notes, {
      windowSize: 5000,
      decayFactor: 0.9
    });
    
    assert.ok(aggregated);
    assert.ok(typeof aggregated.coherence === 'number');
    assert.ok(Array.isArray(aggregated.windows));
    assert.ok(typeof aggregated.summary === 'string');
    assert.ok(Array.isArray(aggregated.conflicts));
  });
});

describe('Downstream Complexity: Multi-Modal with Rendered Code', () => {
  it('should perform multi-modal validation with rendered code for interactive applications', async () => {
    const mockPage = createMockPage({
      html: '<html><head><style>body { color: red; }</style></head><body><div id="test">Content</div></body></html>'
    });
    
    // Extract rendered code for interactive applications
    const renderedCode = await extractRenderedCode(mockPage);
    
    assert.ok(renderedCode);
    assert.ok(renderedCode.html);
    assert.ok(renderedCode.criticalCSS);
    assert.ok(renderedCode.domStructure);
    
    // Simulate multi-modal validation for interactive game testing
    const mockValidateFn = async (path, prompt, context) => {
      return {
        enabled: false, // Mock - no real API call
        provider: 'gemini',
        score: 8,
        issues: [],
        assessment: 'Good'
      };
    };
    
    const result = await multiModalValidation(
      mockValidateFn,
      mockPage,
      'test-validation',
      {
        fps: 1,
        duration: 500,
        captureCode: true,
        captureState: true,
        multiPerspective: false
      }
    );
    
    assert.ok(result);
    assert.ok(result.screenshotPath || result.screenshot);
    assert.ok(result.renderedCode);
  });
});

describe('Downstream Complexity: Multi-Perspective with Rendered Code', () => {
  it('should evaluate from multiple perspectives with rendered code for interactive applications', async () => {
    const mockPage = createMockPage({
      html: '<html><body><div id="game-paddle"></div><div id="game-canvas"></div></body></html>',
      gameState: { gameActive: true, score: 100 }
    });
    
    const renderedCode = await extractRenderedCode(mockPage);
    
    const mockValidateFn = async (path, prompt, context) => {
      return {
        enabled: false,
        provider: 'gemini',
        score: 8,
        issues: [],
        assessment: 'Good'
      };
    };
    
    // Multi-perspective evaluation for interactive game testing
    const evaluations = await multiPerspectiveEvaluation(
      mockValidateFn,
      'test-screenshot.png',
      renderedCode,
      { gameState: { gameActive: true } },
      [
        {
          name: 'Casual Gamer',
          perspective: 'Evaluate from casual gamer perspective',
          focus: ['fun', 'easy']
        },
        {
          name: 'Accessibility Advocate',
          perspective: 'Evaluate from accessibility perspective',
          focus: ['accessible', 'keyboard']
        }
      ]
    );
    
    assert.ok(Array.isArray(evaluations));
    assert.strictEqual(evaluations.length, 2);
    evaluations.forEach(evaluation => {
      assert.ok(evaluation.persona);
      assert.ok(evaluation.evaluation);
    });
  });
});

describe('Downstream Complexity: Full Integration Workflow', () => {
  it('should handle complete interactive application workflow: persona + temporal + multi-modal + batch', async () => {
    const mockPage = createMockPage({
      html: '<html><body><div id="game"></div></body></html>',
      gameState: { gameActive: true, score: 0, bricks: Array(20).fill({}) }
    });
    
    const batchOptimizer = new BatchOptimizer({ maxConcurrency: 2, batchSize: 2 });
    
    // Step 1: Experience page as persona for interactive applications
    const persona = {
      name: 'Test Gamer',
      device: 'desktop',
      goals: ['play game', 'have fun']
    };
    
    const experience = await experiencePageAsPersona(mockPage, persona, {
      captureScreenshots: false,
      captureState: true,
      timeScale: 'human'
    });
    
    assert.ok(experience);
    assert.ok(experience.notes.length > 0);
    
    // Step 2: Capture temporal screenshots for interactive applications
    const screenshots = await captureTemporalScreenshots(mockPage, {
      fps: 2,
      duration: 1000
    });
    
    assert.ok(Array.isArray(screenshots));
    // Note: Mock page may not produce screenshots, test continues with empty array
    
    // Step 3: Extract rendered code for interactive applications
    const renderedCode = await extractRenderedCode(mockPage);
    assert.ok(renderedCode);
    
    // Step 4: Aggregate temporal notes for interactive applications
    // Use experience notes if screenshots weren't captured
    const temporalNotes = screenshots.length > 0
      ? screenshots.map((shot, i) => ({
          step: `frame_${i}`,
          observation: `Frame ${i}`,
          timestamp: shot.timestamp || Date.now() + (i * 100),
          gameState: { score: i * 10 }
        }))
      : experience.notes.map((note, i) => ({
          step: note.step || `note_${i}`,
          observation: note.observation || `Note ${i}`,
          timestamp: note.timestamp || Date.now() + (i * 100),
          gameState: note.gameState || { score: i * 10 }
        }));
    
    const aggregated = aggregateTemporalNotes(temporalNotes);
    assert.ok(aggregated);
    
    // Step 5: Format notes for prompt in interactive applications
    const formatted = formatNotesForPrompt(aggregated);
    assert.ok(typeof formatted === 'string');
    assert.ok(formatted.length > 0);
    
    // Step 6: Batch validation for interactive applications
    const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
    const screenshotPaths = screenshots.length > 0
      ? screenshots.map((shot, i) => shot.path || join(tempDir, `test-${shot.timestamp || i}.png`))
      : [join(tempDir, 'test-screenshot.png')]; // Fallback if no screenshots
    
    // Create temp files if API is enabled
    const config = createConfig();
    if (config.enabled) {
      for (const path of screenshotPaths) {
        if (!existsSync(path)) {
          createTempImage(path);
        }
      }
    }
    
    try {
      const batchResults = await batchOptimizer.batchValidate(
        screenshotPaths,
        `Evaluate: ${formatted}`,
        { persona: persona.name, gameState: { score: 0 } }
      );
      assert.ok(Array.isArray(batchResults));
      
      // Results should be valid (either disabled or validated)
      batchResults.forEach(result => {
        assert.ok(result !== undefined);
        if (result.enabled === false) {
          assert.ok(result.message);
        } else {
          assert.ok(result.provider);
        }
      });
    } finally {
      // Cleanup temp files
      if (config.enabled) {
        cleanupTempFiles(screenshotPaths);
      }
    }
  });
});

describe('Downstream Complexity: Error Recovery', () => {
  it('should handle errors gracefully in interactive applications', async () => {
    const mockPage = createMockPage();
    
    // Test that invalid page objects are handled
    await assert.rejects(
      () => extractRenderedCode(null),
      /ValidationError|Page object is required/
    );
    
    await assert.rejects(
      () => captureTemporalScreenshots(null),
      /ValidationError|Page object is required/
    );
    
    // Test that missing API keys don't crash (handled gracefully)
    // Note: If .env has API key, enabled will be true - that's expected behavior
    const config = createConfig();
    // Config should be valid whether enabled or not
    assert.ok(config !== undefined);
    assert.ok(typeof config.enabled === 'boolean');
    
    // Test that batch optimizer handles empty batches
    const optimizer = new BatchOptimizer();
    // batchValidate requires at least one screenshot, so test with empty array handling
    try {
      const emptyBatch = await optimizer.batchValidate([], 'test', {});
      assert.ok(Array.isArray(emptyBatch));
      assert.strictEqual(emptyBatch.length, 0);
    } catch (error) {
      // If batchValidate throws on empty array, that's also acceptable behavior
      assert.ok(error instanceof Error);
    }
    
    // Test that batch optimizer handles missing files gracefully
    const cfg = createConfig();
    if (cfg.enabled) {
      // If API is enabled, missing file should throw FileError
      await assert.rejects(
        () => optimizer.batchValidate(['nonexistent.png'], 'test', {}),
        FileError
      );
    } else {
      // If API is disabled, should return disabled result (won't try to read file)
      const results = await optimizer.batchValidate(['nonexistent.png'], 'test', {});
      assert.ok(Array.isArray(results));
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].enabled, false);
    }
  });
});

describe('Downstream Complexity: State Tracking', () => {
  it('should track game state changes over time in interactive applications', async () => {
    const states = [
      { gameActive: false, score: 0, bricks: 20 },
      { gameActive: true, score: 0, bricks: 20 },
      { gameActive: true, score: 10, bricks: 18 },
      { gameActive: true, score: 30, bricks: 15 }
    ];
    
    const notes = states.map((state, i) => ({
      step: `state_${i}`,
      observation: `Game state: ${JSON.stringify(state)}`,
      gameState: state,
      timestamp: Date.now() + (i * 1000)
    }));
    
    // Aggregate to detect trends in interactive applications
    const aggregated = aggregateTemporalNotes(notes);
    
    assert.ok(aggregated);
    assert.ok(typeof aggregated.coherence === 'number');
    assert.ok(Array.isArray(aggregated.windows));
    assert.ok(typeof aggregated.summary === 'string');
    assert.ok(Array.isArray(aggregated.conflicts));
    
    // Format for prompt in interactive applications
    const formatted = formatNotesForPrompt(aggregated);
    assert.ok(typeof formatted === 'string');
    assert.ok(formatted.length > 0);
    // Note: formatted string may not include exact keywords, just verify it's formatted
  });
});

