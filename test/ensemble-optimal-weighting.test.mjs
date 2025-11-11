import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnsembleJudge } from '../src/ensemble-judge.mjs';
import { VLLMJudge } from '../src/judge.mjs';

describe('Ensemble Optimal Weighting', () => {
  it('should calculate optimal weights from accuracies', () => {
    const judge = new EnsembleJudge({
      judges: [new VLLMJudge({ enabled: false }), new VLLMJudge({ enabled: false })],
      votingMethod: 'optimal',
      judgeAccuracies: [0.9, 0.7] // 90% and 70% accuracy
    });
    
    // Higher accuracy should get higher weight
    assert.ok(judge.normalizedWeights[0] > judge.normalizedWeights[1]);
    assert.ok(judge.normalizedWeights[0] > 0);
    assert.ok(judge.normalizedWeights[1] > 0);
    
    // Weights should sum to 1
    const sum = judge.normalizedWeights.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001);
  });
  
  it('should handle edge cases in optimal weighting', () => {
    const judge = new EnsembleJudge({
      judges: [new VLLMJudge({ enabled: false })],
      votingMethod: 'optimal',
      judgeAccuracies: [0.0] // Edge case: 0% accuracy
    });
    
    // Should clamp to avoid -∞
    assert.ok(judge.weights[0] > 0);
  });
  
  it('should fall back to weighted_average if no accuracies provided', () => {
    const judge = new EnsembleJudge({
      judges: [new VLLMJudge({ enabled: false }), new VLLMJudge({ enabled: false })],
      votingMethod: 'optimal'
      // No judgeAccuracies
    });
    
    // Should use equal weights
    assert.strictEqual(judge.weights[0], 1.0);
    assert.strictEqual(judge.weights[1], 1.0);
  });
});

