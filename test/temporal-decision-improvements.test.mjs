/**
 * Tests for iterative improvements to temporal decision-making
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  SequentialDecisionContext,
  humanPerceptionTime
} from '../src/temporal-decision.mjs';

describe('Iterative Improvements', () => {
  describe('Adaptive Confidence Thresholds', () => {
    test('high variance scenario has low confidence', () => {
      const context = new SequentialDecisionContext();
      [2, 9, 3, 8, 4].forEach(score => {
        context.addDecision({ score, issues: [] });
      });
      
      const patterns = context.identifyPatterns();
      const confidence = patterns.scoreVariance > 2.0 ? 'low' : 'high';
      
      assert.strictEqual(confidence, 'low');
      assert.ok(patterns.scoreVariance > 2.0);
    });
    
    test('low variance scenario has high confidence', () => {
      const context = new SequentialDecisionContext();
      [7, 8, 7, 8, 7].forEach(score => {
        context.addDecision({ score, issues: [] });
      });
      
      const patterns = context.identifyPatterns();
      const confidence = patterns.scoreVariance < 1.0 ? 'high' : 'low';
      
      assert.strictEqual(confidence, 'high');
      assert.ok(patterns.scoreVariance < 1.0);
    });
    
    test('adaptation is conservative for low confidence', () => {
      const context = new SequentialDecisionContext();
      [2, 9, 3, 8, 4].forEach(score => {
        context.addDecision({ score, issues: [] });
      });
      
      const basePrompt = 'Evaluate this screenshot';
      const adapted = context.adaptPrompt(basePrompt, {});
      
      // Low confidence should have gentler adaptation
      const isGentle = !adapted.includes('Pay special attention') || 
                       adapted.includes('Evaluate independently');
      
      assert.ok(isGentle);
    });
  });
  
  describe('Calibrated Human Perception Time', () => {
    test('visual-appeal is close to 50ms', () => {
      const time = humanPerceptionTime('visual-appeal', {});
      
      // Should be close to 50ms base, but may be adjusted
      assert.ok(time >= 50);
      assert.ok(time <= 200); // Within reasonable range
    });
    
    test('interaction is close to 1s', () => {
      const time = humanPerceptionTime('interaction', {});
      
      // Should be close to 1000ms base
      assert.ok(time >= 500);
      assert.ok(time <= 2000);
    });
    
    test('reading scales with content length', () => {
      const short = humanPerceptionTime('reading', { contentLength: 100 });
      const long = humanPerceptionTime('reading', { contentLength: 2000 });
      
      assert.ok(long > short);
      assert.ok(short >= 1000); // Minimum
      assert.ok(long <= 30000); // Maximum
    });
  });
  
  describe('Sequential Context Optimization', () => {
    test('high confidence triggers stronger adaptation', () => {
      const context = new SequentialDecisionContext();
      [7, 8, 7, 8, 7, 8].forEach(score => {
        context.addDecision({ score, issues: ['contrast'] });
      });
      
      const patterns = context.identifyPatterns();
      const highConfidence = patterns.scoreVariance < 1.0 && patterns.commonIssues.length > 0;
      
      const basePrompt = 'Evaluate this screenshot';
      const adapted = context.adaptPrompt(basePrompt, {});
      
      if (highConfidence) {
        assert.ok(adapted.includes('contrast')); // Should mention recurring issue
      }
    });
    
    test('low confidence uses gentler language', () => {
      const context = new SequentialDecisionContext();
      [2, 9, 3, 8, 4].forEach(score => {
        context.addDecision({ score, issues: [] });
      });
      
      const basePrompt = 'Evaluate this screenshot';
      const adapted = context.adaptPrompt(basePrompt, {});
      
      // Should emphasize independence
      assert.ok(adapted.includes('independently') || adapted.includes('Evaluate independently'));
    });
  });
});

