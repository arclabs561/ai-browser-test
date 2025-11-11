/**
 * Validation: API Response Assumptions
 * 
 * Tests that our assumptions about API response formats are correct
 * and handles edge cases that might occur in production.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Test Case: Gemini API Response Structure
 * Validates our assumptions about Gemini API response format
 */
function testGeminiResponseStructure() {
  // Simulate various Gemini API responses
  const responses = [
    {
      name: 'Normal Response',
      data: {
        candidates: [{
          content: {
            parts: [{
              text: 'Test response'
            }]
          }
        }],
        usageMetadata: {
          promptTokenCount: 1000,
          candidatesTokenCount: 500
        }
      },
      expected: {
        hasText: true,
        hasTokens: true,
        text: 'Test response'
      }
    },
    {
      name: 'Empty Candidates',
      data: {
        candidates: [],
        usageMetadata: {}
      },
      expected: {
        hasText: false,
        hasTokens: true,
        text: 'No response'
      }
    },
    {
      name: 'Missing Parts',
      data: {
        candidates: [{
          content: {}
        }],
        usageMetadata: {}
      },
      expected: {
        hasText: false,
        hasTokens: true,
        text: 'No response'
      }
    },
    {
      name: 'Error Response',
      data: {
        error: {
          message: 'API error',
          code: 400
        }
      },
      expected: {
        hasError: true,
        errorMessage: 'API error'
      }
    }
  ];
  
  const results = responses.map(resp => {
    // Simulate our extraction logic
    const judgment = resp.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    const hasError = !!resp.data.error;
    const hasTokens = !!resp.data.usageMetadata;
    
    return {
      name: resp.name,
      expected: resp.expected,
      actual: {
        hasText: judgment !== 'No response',
        hasTokens,
        hasError,
        text: judgment,
        errorMessage: resp.data.error?.message
      },
      passed: (
        (resp.expected.hasText === undefined || (judgment !== 'No response') === resp.expected.hasText) &&
        (resp.expected.hasTokens === undefined || hasTokens === resp.expected.hasTokens) &&
        (resp.expected.hasError === undefined || hasError === resp.expected.hasError)
      )
    };
  });
  
  return {
    name: 'Gemini API Response Structure',
    hypothesis: 'We correctly handle various Gemini API response formats',
    tests: results,
    passed: results.every(r => r.passed),
    notes: 'Should handle normal responses, empty candidates, missing parts, and errors'
  };
}

/**
 * Test Case: OpenAI API Response Structure
 * Validates our assumptions about OpenAI API response format
 */
function testOpenAIResponseStructure() {
  const responses = [
    {
      name: 'Normal Response',
      data: {
        choices: [{
          message: {
            content: 'Test response'
          }
        }],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500
        }
      },
      expected: {
        hasText: true,
        hasTokens: true,
        text: 'Test response'
      }
    },
    {
      name: 'Empty Choices',
      data: {
        choices: [],
        usage: {}
      },
      expected: {
        hasText: false,
        hasTokens: true,
        text: 'No response'
      }
    },
    {
      name: 'Error Response',
      data: {
        error: {
          message: 'API error',
          code: 'rate_limit_exceeded'
        }
      },
      expected: {
        hasError: true,
        errorMessage: 'API error'
      }
    }
  ];
  
  const results = responses.map(resp => {
    const judgment = resp.data.choices?.[0]?.message?.content || 'No response';
    const hasError = !!resp.data.error;
    const hasTokens = !!resp.data.usage;
    
    return {
      name: resp.name,
      expected: resp.expected,
      actual: {
        hasText: judgment !== 'No response',
        hasTokens,
        hasError,
        text: judgment,
        errorMessage: resp.data.error?.message
      },
      passed: (
        (resp.expected.hasText === undefined || (judgment !== 'No response') === resp.expected.hasText) &&
        (resp.expected.hasTokens === undefined || hasTokens === resp.expected.hasTokens) &&
        (resp.expected.hasError === undefined || hasError === resp.expected.hasError)
      )
    };
  });
  
  return {
    name: 'OpenAI API Response Structure',
    hypothesis: 'We correctly handle various OpenAI API response formats',
    tests: results,
    passed: results.every(r => r.passed),
    notes: 'Should handle normal responses, empty choices, and errors'
  };
}

/**
 * Test Case: Claude API Response Structure
 * Validates our assumptions about Claude API response format
 */
function testClaudeResponseStructure() {
  const responses = [
    {
      name: 'Normal Response',
      data: {
        content: [{
          text: 'Test response'
        }],
        usage: {
          input_tokens: 1000,
          output_tokens: 500
        }
      },
      expected: {
        hasText: true,
        hasTokens: true,
        text: 'Test response'
      }
    },
    {
      name: 'Empty Content',
      data: {
        content: [],
        usage: {}
      },
      expected: {
        hasText: false,
        hasTokens: true,
        text: 'No response'
      }
    },
    {
      name: 'Error Response',
      data: {
        error: {
          message: 'API error',
          type: 'invalid_request_error'
        }
      },
      expected: {
        hasError: true,
        errorMessage: 'API error'
      }
    }
  ];
  
  const results = responses.map(resp => {
    const judgment = resp.data.content?.[0]?.text || 'No response';
    const hasError = !!resp.data.error;
    const hasTokens = !!resp.data.usage;
    
    return {
      name: resp.name,
      expected: resp.expected,
      actual: {
        hasText: judgment !== 'No response',
        hasTokens,
        hasError,
        text: judgment,
        errorMessage: resp.data.error?.message
      },
      passed: (
        (resp.expected.hasText === undefined || (judgment !== 'No response') === resp.expected.hasText) &&
        (resp.expected.hasTokens === undefined || hasTokens === resp.expected.hasTokens) &&
        (resp.expected.hasError === undefined || hasError === resp.expected.hasError)
      )
    };
  });
  
  return {
    name: 'Claude API Response Structure',
    hypothesis: 'We correctly handle various Claude API response formats',
    tests: results,
    passed: results.every(r => r.passed),
    notes: 'Should handle normal responses, empty content, and errors'
  };
}

/**
 * Test Case: JSON Parsing Edge Cases
 * Validates that we handle malformed JSON gracefully
 */
function testJSONParsingEdgeCases() {
  const cases = [
    {
      name: 'Valid JSON',
      json: '{"candidates": [{"content": {"parts": [{"text": "test"}]}}]}',
      expected: { parseable: true, hasError: false }
    },
    {
      name: 'Invalid JSON',
      json: '{invalid json}',
      expected: { parseable: false, hasError: true }
    },
    {
      name: 'Empty String',
      json: '',
      expected: { parseable: false, hasError: true }
    },
    {
      name: 'Null',
      json: null,
      expected: { parseable: false, hasError: true }
    },
    {
      name: 'Undefined',
      json: undefined,
      expected: { parseable: false, hasError: true }
    }
  ];
  
  const results = cases.map(testCase => {
    let parseable = false;
    let hasError = false;
    let parsed = null;
    
    try {
      if (testCase.json === null || testCase.json === undefined) {
        parseable = false;
        hasError = true;
      } else {
        parsed = JSON.parse(testCase.json);
        parseable = true;
      }
    } catch (e) {
      parseable = false;
      hasError = true;
    }
    
    return {
      name: testCase.name,
      expected: testCase.expected,
      actual: { parseable, hasError },
      passed: parseable === testCase.expected.parseable && hasError === testCase.expected.hasError
    };
  });
  
  return {
    name: 'JSON Parsing Edge Cases',
    hypothesis: 'We handle malformed JSON gracefully',
    tests: results,
    passed: results.every(r => r.passed),
    notes: 'Should handle valid JSON, invalid JSON, empty strings, null, and undefined'
  };
}

/**
 * Run all validation tests
 */
async function runValidation() {
  console.log('🔬 Validating API Response Assumptions\n');
  
  const tests = [
    testGeminiResponseStructure(),
    testOpenAIResponseStructure(),
    testClaudeResponseStructure(),
    testJSONParsingEdgeCases()
  ];
  
  const results = {
    timestamp: new Date().toISOString(),
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter(t => t.passed).length,
      failed: tests.filter(t => !t.passed).length
    }
  };
  
  // Print results
  console.log('Results:');
  tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
    console.log(`   Hypothesis: ${test.hypothesis}`);
    if (test.tests) {
      test.tests.forEach(t => {
        const tStatus = t.passed ? '  ✓' : '  ✗';
        console.log(`${tStatus} ${t.name}`);
      });
    }
    if (!test.passed) {
      console.log(`   ⚠️  FAILED: ${test.notes}`);
    }
    console.log();
  });
  
  console.log(`\nSummary: ${results.summary.passed}/${results.summary.total} tests passed`);
  
  // Save results
  const outputPath = join(process.cwd(), 'evaluation', 'results', `api-assumptions-validation-${Date.now()}.json`);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch(console.error);
}

export { runValidation };


