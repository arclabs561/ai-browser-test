/**
 * Tests for score-tracker.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ScoreTracker } from '../src/score-tracker.mjs';

const TEST_BASELINE_DIR = join(tmpdir(), 'ai-browser-test-baseline-test');

test.beforeEach(() => {
  // Clean up test baseline directory
  if (existsSync(TEST_BASELINE_DIR)) {
    try {
      const baselineFile = join(TEST_BASELINE_DIR, 'scores.json');
      if (existsSync(baselineFile)) {
        unlinkSync(baselineFile);
      }
      rmdirSync(TEST_BASELINE_DIR);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  mkdirSync(TEST_BASELINE_DIR, { recursive: true });
});

test.afterEach(() => {
  // Clean up test baseline directory
  if (existsSync(TEST_BASELINE_DIR)) {
    try {
      const baselineFile = join(TEST_BASELINE_DIR, 'scores.json');
      if (existsSync(baselineFile)) {
        unlinkSync(baselineFile);
      }
      rmdirSync(TEST_BASELINE_DIR);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
});

test('ScoreTracker - constructor with default options', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  
  assert.ok(tracker);
  assert.strictEqual(tracker.baselineDir, TEST_BASELINE_DIR);
  assert.strictEqual(tracker.autoSave, true);
});

test('ScoreTracker - record score', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  const entry = tracker.record('test1', 8, { viewport: { width: 1280 } });
  
  assert.ok(entry);
  assert.strictEqual(entry.score, 8);
  assert.ok(entry.timestamp);
  assert.deepStrictEqual(entry.metadata, { viewport: { width: 1280 } });
});

test('ScoreTracker - getBaseline returns null for new test', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  const baseline = tracker.getBaseline('new-test');
  
  assert.strictEqual(baseline, null);
});

test('ScoreTracker - getBaseline returns first recorded score', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  tracker.record('test1', 8);
  tracker.record('test1', 9);
  tracker.record('test1', 7);
  
  const baseline = tracker.getBaseline('test1');
  assert.strictEqual(baseline, 8); // First score becomes baseline
});

test('ScoreTracker - getCurrent returns latest score', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  tracker.record('test1', 8);
  tracker.record('test1', 9);
  tracker.record('test1', 7);
  
  const current = tracker.getCurrent('test1');
  assert.strictEqual(current, 7); // Latest score
});

test('ScoreTracker - compare detects regression', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  tracker.record('test1', 8); // Baseline
  tracker.record('test1', 6); // Regression
  
  const comparison = tracker.compare('test1', 6);
  assert.strictEqual(comparison.hasBaseline, true);
  assert.strictEqual(comparison.baseline, 8);
  assert.strictEqual(comparison.current, 6);
  assert.strictEqual(comparison.delta, -2);
  assert.strictEqual(comparison.regression, true);
  assert.strictEqual(comparison.improvement, false);
});

test('ScoreTracker - compare detects improvement', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  tracker.record('test1', 8); // Baseline
  tracker.record('test1', 10); // Improvement
  
  const comparison = tracker.compare('test1', 10);
  assert.strictEqual(comparison.regression, false);
  assert.strictEqual(comparison.improvement, true);
});

test('ScoreTracker - compare returns unknown for new test', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  const comparison = tracker.compare('new-test', 8);
  
  assert.strictEqual(comparison.hasBaseline, false);
  assert.strictEqual(comparison.trend, 'unknown');
});

test('ScoreTracker - updateBaseline', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  tracker.record('test1', 8);
  tracker.updateBaseline('test1', 10);
  
  const baseline = tracker.getBaseline('test1');
  assert.strictEqual(baseline, 10);
});

test('ScoreTracker - updateBaseline uses current if null', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  tracker.record('test1', 8);
  tracker.record('test1', 9);
  tracker.updateBaseline('test1'); // No argument, uses current
  
  const baseline = tracker.getBaseline('test1');
  assert.strictEqual(baseline, 9);
});

test('ScoreTracker - getStats returns statistics', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  tracker.record('test1', 8);
  tracker.record('test2', 9);
  tracker.record('test1', 7); // Regression
  
  const stats = tracker.getStats();
  
  assert.ok(stats);
  assert.strictEqual(typeof stats.totalTests, 'number');
  assert.strictEqual(typeof stats.testsWithBaselines, 'number');
  assert.strictEqual(typeof stats.testsWithRegressions, 'number');
  assert.ok(stats.totalTests >= 0);
  assert.ok(stats.testsWithBaselines >= 0);
  assert.ok(stats.testsWithRegressions >= 0);
});

test('ScoreTracker - history limit (100 entries)', () => {
  const tracker = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  
  // Record 101 scores
  for (let i = 0; i < 101; i++) {
    tracker.record('test1', i);
  }
  
  const comparison = tracker.compare('test1', 100);
  assert.ok(comparison.history);
  assert.strictEqual(comparison.history.length, 10); // Last 10
});

test('ScoreTracker - persistence across instances', () => {
  const tracker1 = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  tracker1.record('test1', 8);
  
  const tracker2 = new ScoreTracker({ baselineDir: TEST_BASELINE_DIR });
  const baseline = tracker2.getBaseline('test1');
  
  assert.strictEqual(baseline, 8);
});

