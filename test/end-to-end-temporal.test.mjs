/**
 * End-to-End Temporal Decision-Making Test
 * 
 * Tests the complete temporal decision-making system working together
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  validateScreenshot,
  SequentialDecisionContext,
  TemporalBatchOptimizer,
  aggregateMultiScale,
  humanPerceptionTime
} from '../src/index.mjs';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const testResultsDir = join(process.cwd(), 'test-results');
if (!existsSync(testResultsDir)) {
  mkdirSync(testResultsDir, { recursive: true });
}

function createMockScreenshot() {
  const path = join(testResultsDir, `e2e-test-${Date.now()}.png`);
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  writeFileSync(path, pngData);
  return path;
}

describe('End-to-End Temporal Decision-Making', () => {
  test('complete temporal evaluation workflow', async () => {
    // Create sequential context
    const context = new SequentialDecisionContext({ maxHistory: 5 });
    
    // Create temporal batch optimizer
    const optimizer = new TemporalBatchOptimizer({
      sequentialContext: context,
      maxConcurrency: 2,
      batchSize: 2
    });
    
    // Create mock screenshots
    const screenshots = [createMockScreenshot(), createMockScreenshot()];
    
    // Simulate temporal notes
    const now = Date.now();
    const temporalNotes = [];
    
    // Simulate evaluations (will be disabled, but tests the flow)
    const prompt = 'Evaluate this screenshot';
    
    // Test that the system works even when VLLM is disabled
    // (tests the temporal components, not the API calls)
    
    // Test human perception time
    const perceptionTimes = [
      humanPerceptionTime('visual-appeal', {}),
      humanPerceptionTime('interaction', {}),
      humanPerceptionTime('reading', { contentLength: 500 })
    ];
    
    assert.ok(perceptionTimes[0] >= 50 && perceptionTimes[0] <= 200);
    assert.ok(perceptionTimes[1] >= 500 && perceptionTimes[1] <= 2000);
    assert.ok(perceptionTimes[2] >= 2000 && perceptionTimes[2] <= 30000);
    
    // Test sequential context
    context.addDecision({ score: 7, issues: ['contrast'] });
    context.addDecision({ score: 8, issues: ['contrast', 'spacing'] });
    
    const patterns = context.identifyPatterns();
    assert.ok(patterns.trend);
    assert.ok(patterns.commonIssues.includes('contrast'));
    
    // Test multi-scale aggregation
    temporalNotes.push(
      { timestamp: now, elapsed: 0, score: 7, observation: 'Start' },
      { timestamp: now + 1000, elapsed: 1000, score: 8, observation: 'Improvement' },
      { timestamp: now + 5000, elapsed: 5000, score: 9, observation: 'Better' }
    );
    
    const aggregated = aggregateMultiScale(temporalNotes);
    assert.ok(aggregated.scales.short);
    assert.ok(aggregated.scales.medium);
    
    // Cleanup
    screenshots.forEach(path => {
      if (existsSync(path)) unlinkSync(path);
    });
  });
  
  test('temporal components work together harmoniously', () => {
    // Test that all components can be used together
    const context = new SequentialDecisionContext();
    const optimizer = new TemporalBatchOptimizer({ sequentialContext: context });
    
    // Add decisions
    [7, 8, 7, 8, 7].forEach(score => {
      context.addDecision({ score, issues: [] });
    });
    
    // Get context
    const ctx = context.getContext();
    assert.strictEqual(ctx.historyLength, 5);
    
    // Get optimizer stats
    const stats = optimizer.getTemporalStats();
    assert.ok(stats.sequentialContext);
    assert.strictEqual(stats.sequentialContext.historyLength, 5);
    
    // Test perception time with context
    const time = humanPerceptionTime('reading', {
      contentLength: 1000,
      attentionLevel: 'normal'
    });
    assert.ok(time >= 1000);
    
    // Test aggregation
    const now = Date.now();
    const notes = [
      { timestamp: now, elapsed: 0, score: 7 },
      { timestamp: now + 5000, elapsed: 5000, score: 8 }
    ];
    
    const aggregated = aggregateMultiScale(notes);
    assert.ok(aggregated.scales);
  });
});

