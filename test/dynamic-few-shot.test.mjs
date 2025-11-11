import { describe, it } from 'node:test';
import assert from 'node:assert';
import { selectFewShotExamples, formatFewShotExamples } from '../src/dynamic-few-shot.mjs';

describe('Dynamic Few-Shot Examples', () => {
  const examples = [
    {
      description: 'accessibility homepage contrast',
      evaluation: 'High contrast, keyboard accessible',
      score: 9,
      quality: 'High',
      result: { score: 9, assessment: 'excellent' }
    },
    {
      description: 'cluttered interface layout',
      evaluation: 'Functional but cluttered',
      score: 6,
      quality: 'Medium',
      result: { score: 6, assessment: 'needs-improvement' }
    },
    {
      description: 'broken layout accessibility',
      evaluation: 'Poor design, broken layout',
      score: 3,
      quality: 'Low',
      result: { score: 3, assessment: 'fail' }
    },
    {
      description: 'navigation menu design',
      evaluation: 'Good navigation structure',
      score: 7,
      quality: 'Medium',
      result: { score: 7, assessment: 'good' }
    }
  ];
  
  it('should select examples based on keyword similarity', () => {
    const prompt = 'Evaluate accessibility and contrast of this homepage';
    const selected = selectFewShotExamples(prompt, examples, {
      maxExamples: 2,
      useSemanticMatching: true
    });
    
    assert.ok(selected.length <= 2);
    // Should prefer accessibility-related examples
    assert.ok(selected.some(ex => ex.description.includes('accessibility')));
  });
  
  it('should return all examples if fewer than max', () => {
    const selected = selectFewShotExamples('Test', examples.slice(0, 2), {
      maxExamples: 3
    });
    
    assert.strictEqual(selected.length, 2);
  });
  
  it('should format examples correctly', () => {
    const formatted = formatFewShotExamples(examples.slice(0, 2));
    
    assert.ok(formatted.includes('Example 1'));
    assert.ok(formatted.includes('Example 2'));
    assert.ok(formatted.includes('Score: 9'));
    assert.ok(formatted.includes('Score: 6'));
  });
  
  it('should format examples as JSON', () => {
    const formatted = formatFewShotExamples(examples.slice(0, 1), 'json');
    
    assert.ok(formatted.includes('```json'));
    assert.ok(formatted.includes('"score": 9'));
  });
});

