import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectHallucination } from '../src/hallucination-detector.mjs';

describe('Hallucination Detection', () => {
  it('should detect unfaithful claims', () => {
    const judgment = 'The screenshot contains exactly 47 buttons and precisely 12.5% of the screen is blue.';
    const result = detectHallucination(judgment);
    
    assert.ok(result.hasHallucination);
    assert.ok(result.issues.length > 0);
    assert.ok(result.confidence < 1.0);
  });
  
  it('should detect contradictions', () => {
    const judgment = 'The design is excellent and accessible, but also terrible and inaccessible.';
    const result = detectHallucination(judgment);
    
    assert.ok(result.hasHallucination);
    assert.ok(result.issues.some(i => i.includes('Contradictory')));
  });
  
  it('should use logprobs for uncertainty estimation', () => {
    const judgment = 'The screenshot looks good.';
    const logprobs = { token_logprobs: [-0.5, -0.3, -0.2, -0.1] }; // High confidence
    const result = detectHallucination(judgment, null, { logprobs });
    
    // High logprobs = low uncertainty = no hallucination
    assert.strictEqual(result.hasHallucination, false);
  });
  
  it('should detect high uncertainty from low logprobs', () => {
    const judgment = 'The screenshot looks good.';
    const logprobs = { token_logprobs: [-3.0, -2.8, -2.5, -2.9] }; // Low confidence
    const result = detectHallucination(judgment, null, { logprobs });
    
    assert.ok(result.issues.some(i => i.includes('uncertainty')));
    assert.ok(result.confidence < 1.0);
  });
  
  it('should return no hallucination for normal judgment', () => {
    const judgment = 'The screenshot shows a clean interface with good contrast and clear navigation.';
    const result = detectHallucination(judgment);
    
    assert.strictEqual(result.hasHallucination, false);
    assert.strictEqual(result.severity, 'low');
  });
});


