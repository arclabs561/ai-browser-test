import { describe, it } from 'node:test';
import assert from 'node:assert';
import { evaluateWithCounterBalance, shouldUseCounterBalance } from '../src/position-counterbalance.mjs';

describe('Position Counter-Balance', () => {
  it('should return single result when disabled', async () => {
    let callCount = 0;
    const mockEvaluate = async () => {
      callCount++;
      return { score: 8, reasoning: 'Test' };
    };
    
    const result = await evaluateWithCounterBalance(
      mockEvaluate,
      'test.png',
      'Test prompt',
      {},
      { enabled: false }
    );
    
    assert.strictEqual(callCount, 1);
    assert.strictEqual(result.score, 8);
    assert.strictEqual(result.counterBalanced, undefined);
  });
  
  it('should run twice and average when baseline provided', async () => {
    let callCount = 0;
    const mockEvaluate = async (imagePath, prompt, context) => {
      callCount++;
      // Return different scores to test averaging
      return {
        score: callCount === 1 ? 8 : 6,
        reasoning: `Call ${callCount}`,
        issues: ['issue1']
      };
    };
    
    const result = await evaluateWithCounterBalance(
      mockEvaluate,
      'test.png',
      'Test',
      {},
      { enabled: true, baselinePath: 'baseline.png' }
    );
    
    assert.strictEqual(callCount, 2);
    assert.strictEqual(result.score, 7); // (8 + 6) / 2
    assert.strictEqual(result.counterBalanced, true);
    assert.strictEqual(result.originalScore, 8);
    assert.strictEqual(result.reversedScore, 6);
    assert.ok(result.metadata.counterBalancing);
  });
  
  it('should detect position bias when scores differ significantly', async () => {
    const mockEvaluate = async (imagePath, prompt, context) => {
      // Simulate position bias: first call scores higher
      return {
        score: context.comparisonOrder === 'image-first' ? 9 : 5,
        reasoning: 'Test'
      };
    };
    
    const result = await evaluateWithCounterBalance(
      mockEvaluate,
      'test.png',
      'Test',
      {},
      { enabled: true, baselinePath: 'baseline.png' }
    );
    
    assert.ok(result.metadata.counterBalancing.positionBiasDetected);
    assert.strictEqual(result.scoreDifference, 4);
  });
  
  it('should determine if counter-balancing is needed', () => {
    assert.strictEqual(shouldUseCounterBalance({}), false);
    assert.strictEqual(shouldUseCounterBalance({ baseline: 'test.png' }), true);
    assert.strictEqual(shouldUseCounterBalance({ contextOrder: 'original' }), true);
    assert.strictEqual(shouldUseCounterBalance({ images: ['a.png', 'b.png'] }), true);
  });
});

