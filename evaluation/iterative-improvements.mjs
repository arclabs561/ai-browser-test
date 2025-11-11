#!/usr/bin/env node
/**
 * Iterative Improvements Based on Data
 * 
 * Continuously improves the system based on experimental data
 */

import {
  SequentialDecisionContext,
  aggregateMultiScale,
  humanPerceptionTime
} from '../src/temporal-decision.mjs';

/**
 * Improvement 1: Adaptive Confidence Thresholds
 * Based on finding that sequential context increases variance
 */
function testAdaptiveConfidence() {
  console.log('🔧 Improvement 1: Adaptive Confidence Thresholds\n');
  
  const contexts = [
    new SequentialDecisionContext({ maxHistory: 5 }),
    new SequentialDecisionContext({ maxHistory: 5 })
  ];
  
  // Scenario 1: High variance (low confidence)
  const highVarianceScores = [2, 9, 3, 8, 4];
  highVarianceScores.forEach(score => {
    contexts[0].addDecision({ score, issues: [] });
  });
  
  // Scenario 2: Low variance (high confidence)
  const lowVarianceScores = [7, 8, 7, 8, 7];
  lowVarianceScores.forEach(score => {
    contexts[1].addDecision({ score, issues: [] });
  });
  
  const patterns1 = contexts[0].identifyPatterns();
  const patterns2 = contexts[1].identifyPatterns();
  
  // High variance should have lower confidence
  const confidence1 = patterns1.scoreVariance > 2.0 ? 'low' : 'high';
  const confidence2 = patterns2.scoreVariance < 1.0 ? 'high' : 'low';
  
  console.log(`  High variance scenario: ${confidence1} confidence (variance: ${patterns1.scoreVariance.toFixed(2)})`);
  console.log(`  Low variance scenario: ${confidence2} confidence (variance: ${patterns2.scoreVariance.toFixed(2)})`);
  
  return {
    improvement: 'Adaptive confidence thresholds',
    highVariance: { confidence: confidence1, variance: patterns1.scoreVariance },
    lowVariance: { confidence: confidence2, variance: patterns2.scoreVariance },
    recommendation: confidence1 === 'low' && confidence2 === 'high' ? 'SUCCESS' : 'NEEDS_WORK'
  };
}

/**
 * Improvement 2: Calibrated Human Perception Time
 * Based on 75% alignment finding
 */
function testCalibratedPerceptionTime() {
  console.log('🔧 Improvement 2: Calibrated Human Perception Time\n');
  
  const tests = [
    { action: 'visual-appeal', expected: 50, tolerance: 20 },
    { action: 'interaction', expected: 1000, tolerance: 500 },
    { action: 'reading', context: { contentLength: 500 }, expected: 12000, tolerance: 5000 }
  ];
  
  const results = tests.map(test => {
    const time = humanPerceptionTime(test.action, test.context || {});
    const deviation = Math.abs(time - test.expected);
    const withinTolerance = deviation <= test.tolerance;
    
    return {
      ...test,
      actual: time,
      deviation,
      withinTolerance
    };
  });
  
  const alignmentRate = results.filter(r => r.withinTolerance).length / results.length;
  
  console.log(`  Alignment rate: ${(alignmentRate * 100).toFixed(1)}%`);
  results.forEach(r => {
    console.log(`  ${r.action}: ${r.actual}ms (expected: ${r.expected}ms, deviation: ${r.deviation}ms)`);
  });
  
  return {
    improvement: 'Calibrated human perception time',
    alignmentRate,
    results,
    recommendation: alignmentRate >= 0.8 ? 'SUCCESS' : 'NEEDS_CALIBRATION'
  };
}

/**
 * Improvement 3: Multi-Scale Pattern Detection
 * Based on finding that multi-scale is effective
 */
function testMultiScalePatterns() {
  console.log('🔧 Improvement 3: Multi-Scale Pattern Detection\n');
  
  const now = Date.now();
  const notes = [
    { timestamp: now, elapsed: 0, score: 8, observation: 'Start', salience: 'high' },
    { timestamp: now + 200, elapsed: 200, score: 7, observation: 'Quick', salience: 'normal' },
    { timestamp: now + 1500, elapsed: 1500, score: 9, observation: 'Improvement', salience: 'high' },
    { timestamp: now + 5000, elapsed: 5000, score: 8, observation: 'Stable', salience: 'normal' },
    { timestamp: now + 12000, elapsed: 12000, score: 9, observation: 'Long term', salience: 'high' }
  ];
  
  const aggregated = aggregateMultiScale(notes, { attentionWeights: true });
  
  // Analyze patterns at different scales
  const patterns = {};
  for (const [scaleName, scale] of Object.entries(aggregated.scales)) {
    if (scale.windows.length > 0) {
      const scores = scale.windows.map(w => w.avgScore);
      patterns[scaleName] = {
        windowCount: scale.windows.length,
        coherence: scale.coherence,
        scoreRange: { min: Math.min(...scores), max: Math.max(...scores) },
        variance: calculateVariance(scores)
      };
    }
  }
  
  console.log(`  Scales analyzed: ${Object.keys(patterns).length}`);
  Object.entries(patterns).forEach(([name, data]) => {
    console.log(`  ${name}: ${data.windowCount} windows, coherence ${(data.coherence * 100).toFixed(1)}%, variance ${data.variance.toFixed(3)}`);
  });
  
  return {
    improvement: 'Multi-scale pattern detection',
    patterns,
    recommendation: Object.keys(patterns).length >= 3 ? 'SUCCESS' : 'NEEDS_WORK'
  };
}

/**
 * Improvement 4: Sequential Context Optimization
 * Based on finding that it increases variance
 */
function testSequentialOptimization() {
  console.log('🔧 Improvement 4: Sequential Context Optimization\n');
  
  // Test with different confidence thresholds
  const context = new SequentialDecisionContext({ maxHistory: 5 });
  
  // Add decisions with varying consistency
  [7, 8, 7, 8, 7].forEach(score => {
    context.addDecision({ score, issues: [] });
  });
  
  const patterns = context.identifyPatterns();
  const highConfidence = patterns.scoreVariance < 1.0 && patterns.commonIssues.length > 0;
  
  // Test prompt adaptation
  const basePrompt = 'Evaluate this screenshot';
  const adapted = context.adaptPrompt(basePrompt, {});
  
  // Check if adaptation is conservative (data shows over-correction)
  const isConservative = !adapted.includes('Pay special attention') || highConfidence;
  
  console.log(`  Variance: ${patterns.scoreVariance.toFixed(2)}`);
  console.log(`  High confidence: ${highConfidence}`);
  console.log(`  Conservative adaptation: ${isConservative}`);
  
  return {
    improvement: 'Sequential context optimization',
    variance: patterns.scoreVariance,
    highConfidence,
    isConservative,
    recommendation: isConservative ? 'SUCCESS' : 'NEEDS_OPTIMIZATION'
  };
}

/**
 * Run all improvements
 */
function runIterativeImprovements() {
  console.log('🚀 Iterative Improvements Based on Data\n');
  console.log('Testing improvements to address experimental findings...\n');
  
  const improvements = {
    timestamp: new Date().toISOString(),
    results: {}
  };
  
  improvements.results.adaptiveConfidence = testAdaptiveConfidence();
  improvements.results.calibratedPerception = testCalibratedPerceptionTime();
  improvements.results.multiScalePatterns = testMultiScalePatterns();
  improvements.results.sequentialOptimization = testSequentialOptimization();
  
  // Summary
  console.log('\n📊 Summary\n');
  const successCount = Object.values(improvements.results)
    .filter(r => r.recommendation === 'SUCCESS').length;
  const needsWorkCount = Object.values(improvements.results)
    .filter(r => r.recommendation !== 'SUCCESS').length;
  
  console.log(`Successful improvements: ${successCount}/${Object.keys(improvements.results).length}`);
  console.log(`Needs work: ${needsWorkCount}`);
  
  // Recommendations
  console.log('\n💡 Recommendations\n');
  Object.entries(improvements.results).forEach(([name, result]) => {
    if (result.recommendation !== 'SUCCESS') {
      console.log(`  - ${name}: ${result.recommendation}`);
    }
  });
  
  return improvements;
}

function calculateVariance(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIterativeImprovements();
}

export { runIterativeImprovements };

