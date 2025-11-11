/**
 * Validation: Cost Tracking Accuracy
 * 
 * Tests that cost tracking correctly records and calculates costs.
 * Validates against known API pricing to ensure accuracy.
 */

import { CostTracker, recordCost, getCostStats } from '../src/cost-tracker.mjs';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Test Case: Cost Recording Accuracy
 * Validates that costs are recorded correctly
 */
function testCostRecording() {
  const tracker = new CostTracker();
  tracker.reset(); // Start fresh
  
  // Record known costs
  const costs = [
    { provider: 'gemini', cost: 0.0002, inputTokens: 1000, outputTokens: 500 },
    { provider: 'gemini', cost: 0.0003, inputTokens: 1500, outputTokens: 600 },
    { provider: 'openai', cost: 0.0004, inputTokens: 1000, outputTokens: 500 }
  ];
  
  costs.forEach(c => tracker.recordCost(c));
  
  const stats = tracker.getStats();
  
  const expectedTotal = costs.reduce((sum, c) => sum + c.cost, 0);
  const actualTotal = stats.total;
  
  return {
    name: 'Cost Recording Accuracy',
    hypothesis: 'Costs are recorded and summed correctly',
    expected: {
      total: expectedTotal,
      geminiTotal: costs.filter(c => c.provider === 'gemini').reduce((sum, c) => sum + c.cost, 0),
      count: costs.length
    },
    actual: {
      total: actualTotal,
      geminiTotal: stats.byProvider.gemini?.total || 0,
      count: stats.count
    },
    passed: Math.abs(actualTotal - expectedTotal) < 0.0001 && stats.count === costs.length,
    notes: 'Total cost and count should match recorded costs'
  };
}

/**
 * Test Case: Cost Projection Accuracy
 * Validates that cost projections are reasonable
 */
function testCostProjection() {
  const tracker = new CostTracker();
  tracker.reset();
  
  // Record costs for 7 days
  const dailyCost = 0.01; // $0.01 per day
  for (let i = 0; i < 7; i++) {
    tracker.recordCost({
      provider: 'gemini',
      cost: dailyCost,
      timestamp: Date.now() - (6 - i) * 24 * 60 * 60 * 1000, // Last 7 days
      testName: `day-${i}`
    });
  }
  
  const projection = tracker.getProjection(30);
  
  return {
    name: 'Cost Projection Accuracy',
    hypothesis: 'Projections are based on historical averages',
    expected: {
      dailyAverage: dailyCost,
      projected30Days: dailyCost * 30
    },
    actual: {
      dailyAverage: projection.dailyAverage,
      projected30Days: projection.projected,
      trend: projection.trend
    },
    passed: Math.abs(projection.dailyAverage - dailyCost) < 0.001,
    notes: 'Projection should be based on historical daily average'
  };
}

/**
 * Test Case: Threshold Checking
 * Validates that threshold checking works correctly
 */
function testThresholdChecking() {
  const tracker = new CostTracker();
  tracker.reset();
  
  tracker.recordCost({ provider: 'gemini', cost: 5.0 });
  tracker.recordCost({ provider: 'gemini', cost: 3.0 });
  
  const check10 = tracker.checkThreshold(10.0);
  const check5 = tracker.checkThreshold(5.0);
  const check2 = tracker.checkThreshold(2.0);
  
  return {
    name: 'Threshold Checking',
    hypothesis: 'Threshold checking correctly identifies exceeded thresholds',
    expected: {
      threshold10: { exceeded: false, current: 8.0, remaining: 2.0 },
      threshold5: { exceeded: true, current: 8.0, remaining: 0 },
      threshold2: { exceeded: true, current: 8.0, remaining: 0 }
    },
    actual: {
      threshold10: check10,
      threshold5: check5,
      threshold2: check2
    },
    passed: !check10.exceeded && check5.exceeded && check2.exceeded,
    notes: 'Should correctly identify when threshold is exceeded'
  };
}

/**
 * Test Case: Provider Breakdown
 * Validates that costs are tracked per provider
 */
function testProviderBreakdown() {
  const tracker = new CostTracker();
  tracker.reset();
  
  tracker.recordCost({ provider: 'gemini', cost: 1.0, inputTokens: 1000, outputTokens: 500 });
  tracker.recordCost({ provider: 'openai', cost: 2.0, inputTokens: 2000, outputTokens: 1000 });
  tracker.recordCost({ provider: 'claude', cost: 3.0, inputTokens: 3000, outputTokens: 1500 });
  
  const stats = tracker.getStats();
  
  return {
    name: 'Provider Breakdown',
    hypothesis: 'Costs are tracked separately per provider',
    expected: {
      gemini: 1.0,
      openai: 2.0,
      claude: 3.0,
      total: 6.0
    },
    actual: {
      gemini: stats.byProvider.gemini?.total || 0,
      openai: stats.byProvider.openai?.total || 0,
      claude: stats.byProvider.claude?.total || 0,
      total: stats.total
    },
    passed: Math.abs(stats.byProvider.gemini?.total - 1.0) < 0.01 &&
            Math.abs(stats.byProvider.openai?.total - 2.0) < 0.01 &&
            Math.abs(stats.byProvider.claude?.total - 3.0) < 0.01,
    notes: 'Each provider should have separate cost tracking'
  };
}

/**
 * Test Case: Token Tracking
 * Validates that input/output tokens are tracked correctly
 */
function testTokenTracking() {
  const tracker = new CostTracker();
  tracker.reset();
  
  tracker.recordCost({
    provider: 'gemini',
    cost: 0.0002,
    inputTokens: 1000,
    outputTokens: 500
  });
  
  tracker.recordCost({
    provider: 'gemini',
    cost: 0.0003,
    inputTokens: 1500,
    outputTokens: 600
  });
  
  const stats = tracker.getStats();
  const geminiStats = stats.byProvider.gemini;
  
  return {
    name: 'Token Tracking',
    hypothesis: 'Input and output tokens are tracked correctly',
    expected: {
      inputTokens: 2500,
      outputTokens: 1100
    },
    actual: {
      inputTokens: geminiStats?.inputTokens || 0,
      outputTokens: geminiStats?.outputTokens || 0
    },
    passed: geminiStats?.inputTokens === 2500 && geminiStats?.outputTokens === 1100,
    notes: 'Token counts should be summed correctly'
  };
}

/**
 * Run all validation tests
 */
async function runValidation() {
  console.log('🔬 Validating Cost Tracking Accuracy\n');
  
  const tests = [
    testCostRecording(),
    testCostProjection(),
    testThresholdChecking(),
    testProviderBreakdown(),
    testTokenTracking()
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
    if (test.expected) {
      console.log(`   Expected: ${JSON.stringify(test.expected)}`);
    }
    console.log(`   Actual: ${JSON.stringify(test.actual)}`);
    if (!test.passed) {
      console.log(`   ⚠️  FAILED: ${test.notes}`);
    }
    console.log();
  });
  
  console.log(`\nSummary: ${results.summary.passed}/${results.summary.total} tests passed`);
  
  // Save results
  const outputPath = join(process.cwd(), 'evaluation', 'results', `cost-tracking-validation-${Date.now()}.json`);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch(console.error);
}

export { runValidation };


