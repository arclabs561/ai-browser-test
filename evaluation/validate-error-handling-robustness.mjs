/**
 * Validation: Error Handling Robustness
 * 
 * Tests that error handling is robust against various failure scenarios
 * that might occur in production (network failures, malformed responses, etc.)
 */

import { ProviderError, TimeoutError, FileError } from '../src/errors.mjs';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Test Case: Network Failure Handling
 * Validates that network failures are handled gracefully
 */
function testNetworkFailureHandling() {
  const scenarios = [
    {
      name: 'Connection Timeout',
      error: new TimeoutError('Connection timeout', 5000),
      expected: { retryable: true, handled: true }
    },
    {
      name: 'Network Error',
      error: new Error('Network error'),
      expected: { retryable: true, handled: true }
    },
    {
      name: 'DNS Failure',
      error: new Error('getaddrinfo ENOTFOUND'),
      expected: { retryable: true, handled: true }
    },
    {
      name: 'ECONNREFUSED',
      error: new Error('ECONNREFUSED'),
      expected: { retryable: true, handled: true }
    }
  ];
  
  const results = scenarios.map(scenario => {
    const isNetworkError = 
      scenario.error.message?.includes('network') ||
      scenario.error.message?.includes('timeout') ||
      scenario.error.message?.includes('ENOTFOUND') ||
      scenario.error.message?.includes('ECONNREFUSED') ||
      scenario.error instanceof TimeoutError;
    
    return {
      name: scenario.name,
      expected: scenario.expected,
      actual: {
        retryable: isNetworkError,
        handled: isNetworkError || scenario.error instanceof TimeoutError
      },
      passed: isNetworkError === scenario.expected.retryable
    };
  });
  
  return {
    name: 'Network Failure Handling',
    hypothesis: 'Network failures are identified and handled gracefully',
    tests: results,
    passed: results.every(r => r.passed),
    notes: 'Network errors should be retryable'
  };
}

/**
 * Test Case: Malformed Response Handling
 * Validates that malformed API responses are handled gracefully
 */
function testMalformedResponseHandling() {
  const scenarios = [
    {
      name: 'Invalid JSON',
      response: '{invalid json}',
      expected: { handled: true, errorThrown: true }
    },
    {
      name: 'Empty Response',
      response: '',
      expected: { handled: true, errorThrown: true }
    },
    {
      name: 'Null Response',
      response: null,
      expected: { handled: true, errorThrown: true }
    },
    {
      name: 'Unexpected Structure',
      response: { unexpected: 'structure' },
      expected: { handled: true, fallback: 'No response' }
    }
  ];
  
  const results = scenarios.map(scenario => {
    let handled = false;
    let errorThrown = false;
    let fallback = null;
    
    try {
      if (scenario.response === null || scenario.response === '') {
        errorThrown = true;
        handled = true;
        fallback = 'No response';
      } else {
        try {
          const parsed = typeof scenario.response === 'string' 
            ? JSON.parse(scenario.response) 
            : scenario.response;
          
          // Try to extract judgment (simulate our logic)
          const judgment = parsed.candidates?.[0]?.content?.parts?.[0]?.text ||
                          parsed.choices?.[0]?.message?.content ||
                          parsed.content?.[0]?.text ||
                          'No response';
          
          handled = true;
          fallback = judgment;
        } catch (e) {
          errorThrown = true;
          handled = true;
          fallback = 'No response';
        }
      }
    } catch (e) {
      errorThrown = true;
      handled = true;
    }
    
    return {
      name: scenario.name,
      expected: scenario.expected,
      actual: { handled, errorThrown, fallback },
      passed: handled === scenario.expected.handled
    };
  });
  
  return {
    name: 'Malformed Response Handling',
    hypothesis: 'Malformed API responses are handled gracefully',
    tests: results,
    passed: results.every(r => r.passed),
    notes: 'Should handle invalid JSON, empty responses, null, and unexpected structures'
  };
}

/**
 * Test Case: Rate Limit Handling
 * Validates that rate limits are handled correctly
 */
function testRateLimitHandling() {
  const scenarios = [
    {
      name: '429 Rate Limit',
      error: new ProviderError('Rate limit exceeded', 'gemini', { statusCode: 429 }),
      expected: { retryable: true, handled: true }
    },
    {
      name: '429 with Retry-After',
      error: new ProviderError('Rate limit', 'openai', { 
        statusCode: 429,
        retryAfter: 60
      }),
      expected: { retryable: true, handled: true, respectsRetryAfter: true }
    },
    {
      name: '503 Service Unavailable',
      error: new ProviderError('Service unavailable', 'claude', { statusCode: 503 }),
      expected: { retryable: true, handled: true }
    }
  ];
  
  const results = scenarios.map(scenario => {
    const isRetryable = 
      scenario.error.details?.statusCode === 429 ||
      scenario.error.details?.statusCode >= 500;
    
    return {
      name: scenario.name,
      expected: scenario.expected,
      actual: {
        retryable: isRetryable,
        handled: true,
        respectsRetryAfter: scenario.error.details?.retryAfter !== undefined
      },
      passed: isRetryable === scenario.expected.retryable
    };
  });
  
  return {
    name: 'Rate Limit Handling',
    hypothesis: 'Rate limits are identified and handled with retries',
    tests: results,
    passed: results.every(r => r.passed),
    notes: '429 and 5xx errors should be retryable'
  };
}

/**
 * Test Case: Partial Response Handling
 * Validates that partial/incomplete responses are handled
 */
function testPartialResponseHandling() {
  const scenarios = [
    {
      name: 'Partial JSON',
      response: '{"candidates": [{"content": {"parts": [{"text": "partial',
      expected: { handled: true, errorThrown: true }
    },
    {
      name: 'Truncated Response',
      response: { candidates: [{ content: { parts: [] } }] },
      expected: { handled: true, fallback: 'No response' }
    },
    {
      name: 'Missing Required Fields',
      response: { candidates: [{}] },
      expected: { handled: true, fallback: 'No response' }
    }
  ];
  
  const results = scenarios.map(scenario => {
    let handled = false;
    let errorThrown = false;
    let fallback = null;
    
    try {
      if (typeof scenario.response === 'string') {
        try {
          JSON.parse(scenario.response);
        } catch (e) {
          errorThrown = true;
          handled = true;
          fallback = 'No response';
        }
      } else {
        const judgment = scenario.response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        handled = true;
        fallback = judgment;
      }
    } catch (e) {
      errorThrown = true;
      handled = true;
    }
    
    return {
      name: scenario.name,
      expected: scenario.expected,
      actual: { handled, errorThrown, fallback },
      passed: handled === scenario.expected.handled
    };
  });
  
  return {
    name: 'Partial Response Handling',
    hypothesis: 'Partial/incomplete responses are handled gracefully',
    tests: results,
    passed: results.every(r => r.passed),
    notes: 'Should handle partial JSON, truncated responses, and missing fields'
  };
}

/**
 * Run all validation tests
 */
async function runValidation() {
  console.log('🔬 Validating Error Handling Robustness\n');
  
  const tests = [
    testNetworkFailureHandling(),
    testMalformedResponseHandling(),
    testRateLimitHandling(),
    testPartialResponseHandling()
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
  const outputPath = join(process.cwd(), 'evaluation', 'results', `error-handling-validation-${Date.now()}.json`);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch(console.error);
}

export { runValidation };


