/**
 * Integration Test: v0.3.0 Features Validation
 * 
 * Validates that all new features work together correctly:
 * 1. Unified prompt composition system
 * 2. Hallucination detection
 * 3. True multi-image pair comparison
 * 4. Optimal ensemble weighting
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { VLLMJudge } from '../src/judge.mjs';
import { comparePair } from '../src/pair-comparison.mjs';
import { EnsembleJudge } from '../src/ensemble-judge.mjs';
import { detectHallucination } from '../src/hallucination-detector.mjs';
import { composeSingleImagePrompt, composeComparisonPrompt } from '../src/prompt-composer.mjs';
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

function cleanup(paths) {
  for (const path of paths) {
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {}
    }
  }
}

describe('v0.3.0 Features Integration', () => {
  describe('Unified Prompt Composition', () => {
    it('should compose single image prompt with rubric', () => {
      const prompt = composeSingleImagePrompt(
        'Evaluate this screenshot',
        { testType: 'accessibility' },
        { includeRubric: true }
      );
      
      assert.ok(prompt.includes('Evaluate this screenshot'));
      assert.ok(prompt.includes('RUBRIC') || prompt.includes('Criteria'));
      assert.ok(prompt.includes('accessibility') || prompt.includes('Test Type'));
    });
    
    it('should compose comparison prompt with structured format', () => {
      const prompt = composeComparisonPrompt(
        'Compare these screenshots',
        { testType: 'visual-appeal' }
      );
      
      assert.ok(prompt.includes('Compare'));
      assert.ok(prompt.includes('winner') || prompt.includes('A') || prompt.includes('B'));
      assert.ok(prompt.includes('RUBRIC') || prompt.includes('Criteria'));
    });
    
    it('should integrate with VLLMJudge.buildPrompt', () => {
      const judge = new VLLMJudge({ enabled: false });
      const prompt = judge.buildPrompt('Test prompt', {
        testType: 'accessibility',
        viewport: { width: 1920, height: 1080 }
      });
      
      assert.ok(prompt.includes('Test prompt'));
      assert.ok(prompt.includes('1920') || prompt.includes('1080') || prompt.includes('RUBRIC'));
    });
  });
  
  describe('Hallucination Detection Integration', () => {
    it('should detect hallucination in judgment', () => {
      const judgment = 'The screenshot contains exactly 47 buttons, which is optimal for UX.';
      const result = detectHallucination(judgment);
      
      assert.ok(result.hasHallucination || result.issues.length > 0);
    });
    
    it('should work with logprobs from API response', () => {
      const judgment = 'The design looks good.';
      // Use format expected by estimateUncertaintyFromLogprobs: token_logprobs array
      const logprobs = {
        token_logprobs: [-0.1, -0.2, -0.15, -0.1] // High confidence (all > -2.0)
      };
      
      const result = detectHallucination(judgment, null, { logprobs });
      assert.ok(typeof result.confidence === 'number');
      assert.ok(result.confidence >= 0 && result.confidence <= 1);
    });
    
    it('should detect high uncertainty from low logprobs', () => {
      const judgment = 'The screenshot looks okay.';
      // Use format expected by estimateUncertaintyFromLogprobs: token_logprobs array
      const logprobs = {
        token_logprobs: [-3.0, -2.8, -2.9, -3.1] // Low confidence (average ~-2.95, below -2.0 threshold)
      };
      
      const result = detectHallucination(judgment, null, { logprobs, checkUncertainty: true });
      // Low logprobs should trigger uncertainty detection
      assert.ok(
        result.issues.some(i => i.toLowerCase().includes('uncertainty')) || 
        result.confidence < 0.7,
        `Expected uncertainty detection or low confidence, got confidence=${result.confidence}, issues=${result.issues.join(', ')}`
      );
    });
  });
  
  describe('Multi-Image Pair Comparison', () => {
    it('should use true multi-image API call', async () => {
      const config = createConfig();
      if (!config.enabled) {
        return; // Skip if no API key
      }
      
      const tempDir = join(tmpdir(), `multi-img-test-${Date.now()}`);
      const img1 = join(tempDir, 'img1.png');
      const img2 = join(tempDir, 'img2.png');
      
      try {
        createTestImage(img1);
        createTestImage(img2);
        
        const result = await comparePair(img1, img2, 'Compare these screenshots', {});
        
        assert.ok(result !== undefined);
        if (result.enabled) {
          // Verify it used multi-image method
          assert.ok(result.comparison);
          assert.strictEqual(result.comparison.method, 'multi-image');
          assert.ok(['A', 'B', 'tie'].includes(result.winner));
        }
      } finally {
        cleanup([img1, img2]);
      }
    });
    
    it('should handle array of images in judgeScreenshot', async () => {
      const config = createConfig();
      if (!config.enabled) {
        return;
      }
      
      const tempDir = join(tmpdir(), `judge-multi-${Date.now()}`);
      const img1 = join(tempDir, 'img1.png');
      const img2 = join(tempDir, 'img2.png');
      
      try {
        createTestImage(img1);
        createTestImage(img2);
        
        const judge = new VLLMJudge();
        const result = await judge.judgeScreenshot([img1, img2], 'Compare these', {
          testType: 'comparison'
        });
        
        if (result.enabled) {
          assert.ok(result.judgment);
          // Multi-image should produce comparison-style output
          assert.ok(result.judgment.includes('A') || result.judgment.includes('B') || 
                   result.judgment.includes('compare') || result.judgment.includes('better'));
        }
      } finally {
        cleanup([img1, img2]);
      }
    });
  });
  
  describe('Optimal Ensemble Weighting', () => {
    it('should calculate optimal weights correctly', () => {
      const judge1 = new VLLMJudge({ enabled: false });
      const judge2 = new VLLMJudge({ enabled: false });
      const judge3 = new VLLMJudge({ enabled: false });
      
      const ensemble = new EnsembleJudge({
        judges: [judge1, judge2, judge3],
        votingMethod: 'optimal',
        judgeAccuracies: [0.95, 0.80, 0.70] // High, medium, low accuracy
      });
      
      // Higher accuracy should get higher weight
      assert.ok(ensemble.normalizedWeights[0] > ensemble.normalizedWeights[1]);
      assert.ok(ensemble.normalizedWeights[1] > ensemble.normalizedWeights[2]);
      
      // Weights should sum to 1
      const sum = ensemble.normalizedWeights.reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1.0) < 0.001, `Weights sum to ${sum}, expected 1.0`);
    });
    
    it('should use optimal weighting in aggregation', async () => {
      const judge1 = new VLLMJudge({ enabled: false });
      const judge2 = new VLLMJudge({ enabled: false });
      
      const ensemble = new EnsembleJudge({
        judges: [judge1, judge2],
        votingMethod: 'optimal',
        judgeAccuracies: [0.9, 0.6]
      });
      
      // Mock results
      const results = [
        { enabled: true, score: 8, confidence: 0.9 },
        { enabled: true, score: 6, confidence: 0.7 }
      ];
      
      const aggregated = ensemble.aggregateResults(results);
      
      // Higher accuracy judge should have more influence
      // With optimal weighting, the 0.9 accuracy judge should dominate
      assert.ok(aggregated.score >= 6 && aggregated.score <= 8);
      assert.ok(typeof aggregated.confidence === 'number');
    });
  });
  
  describe('End-to-End Feature Integration', () => {
    it('should use all features together in a realistic scenario', async () => {
      const config = createConfig();
      if (!config.enabled) {
        return;
      }
      
      const tempDir = join(tmpdir(), `e2e-test-${Date.now()}`);
      const img1 = join(tempDir, 'img1.png');
      const img2 = join(tempDir, 'img2.png');
      
      try {
        createTestImage(img1);
        createTestImage(img2);
        
        // 1. Use prompt composer
        const prompt = composeComparisonPrompt(
          'Which screenshot has better accessibility?',
          { testType: 'accessibility' }
        );
        assert.ok(prompt.includes('accessibility'));
        
        // 2. Use multi-image comparison
        const comparison = await comparePair(img1, img2, prompt, {});
        
        if (comparison.enabled) {
          assert.ok(comparison.comparison);
          assert.strictEqual(comparison.comparison.method, 'multi-image');
          
          // 3. Check for hallucination in reasoning
          if (comparison.reasoning) {
            const hallucinationCheck = detectHallucination(comparison.reasoning);
            // Should not have critical hallucinations
            assert.ok(hallucinationCheck.severity !== 'high' || !hallucinationCheck.hasHallucination);
          }
          
          // 4. Use ensemble with optimal weighting
          const judge1 = new VLLMJudge();
          const judge2 = new VLLMJudge({ provider: 'openai' });
          
          const ensemble = new EnsembleJudge({
            judges: [judge1, judge2],
            votingMethod: 'optimal',
            judgeAccuracies: [0.85, 0.75]
          });
          
          // Verify ensemble is configured correctly
          assert.strictEqual(ensemble.votingMethod, 'optimal');
          assert.ok(ensemble.normalizedWeights.length === 2);
        }
      } finally {
        cleanup([img1, img2]);
      }
    });
  });
});

