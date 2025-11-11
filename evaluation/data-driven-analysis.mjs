#!/usr/bin/env node
/**
 * Data-Driven Analysis Framework
 * 
 * Runs systematic experiments and analyzes results to make concrete improvements.
 * Uses scientific approach: hypothesis → experiment → data → analysis → improvement
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  SequentialDecisionContext,
  aggregateMultiScale,
  humanPerceptionTime
} from '../src/temporal-decision.mjs';
import { TemporalBatchOptimizer } from '../src/temporal-batch-optimizer.mjs';

const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results', 'data-driven');
const ANALYSIS_DIR = join(process.cwd(), 'evaluation', 'analysis');

if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
if (!existsSync(ANALYSIS_DIR)) mkdirSync(ANALYSIS_DIR, { recursive: true });

/**
 * Hypothesis 1: Sequential context improves consistency
 */
function testSequentialConsistency() {
  console.log('📊 Hypothesis 1: Sequential context improves consistency\n');
  
  // Simulate isolated evaluations (no context)
  const isolatedScores = [7.2, 8.1, 6.9, 7.8, 8.3, 7.1, 8.0, 7.5];
  const isolatedVariance = calculateVariance(isolatedScores);
  
  // Simulate sequential evaluations (with context)
  const context = new SequentialDecisionContext();
  const sequentialScores = [];
  
  // Simulate context adaptation
  isolatedScores.forEach((score, i) => {
    context.addDecision({ score, issues: [] });
    const patterns = context.identifyPatterns();
    
    // Context adaptation would adjust score slightly
    let adjustedScore = score;
    if (patterns.trend === 'declining' && i > 0) {
      adjustedScore = score * 0.98; // Slight penalty for declining trend
    } else if (patterns.trend === 'improving' && i > 0) {
      adjustedScore = score * 1.01; // Slight boost for improving trend
    }
    
    sequentialScores.push(adjustedScore);
  });
  
  const sequentialVariance = calculateVariance(sequentialScores);
  const improvement = ((isolatedVariance - sequentialVariance) / isolatedVariance) * 100;
  
  return {
    hypothesis: 'Sequential context improves consistency',
    isolated: {
      scores: isolatedScores,
      variance: isolatedVariance,
      mean: calculateMean(isolatedScores)
    },
    sequential: {
      scores: sequentialScores,
      variance: sequentialVariance,
      mean: calculateMean(sequentialScores)
    },
    improvement,
    conclusion: improvement > 0 ? 'SUPPORTED' : 'NOT SUPPORTED'
  };
}

/**
 * Hypothesis 2: Multi-scale aggregation captures different patterns
 */
function testMultiScalePatterns() {
  console.log('📊 Hypothesis 2: Multi-scale aggregation captures different patterns\n');
  
  const now = Date.now();
  const notes = [
    { timestamp: now, elapsed: 0, score: 8, observation: 'Start', salience: 'high' },
    { timestamp: now + 200, elapsed: 200, score: 7, observation: 'Quick change', salience: 'normal' },
    { timestamp: now + 1500, elapsed: 1500, score: 9, observation: 'Improvement', salience: 'high' },
    { timestamp: now + 5000, elapsed: 5000, score: 8, observation: 'Stable', salience: 'normal' },
    { timestamp: now + 12000, elapsed: 12000, score: 9, observation: 'Long term', salience: 'high' }
  ];
  
  const aggregated = aggregateMultiScale(notes, { attentionWeights: true });
  
  // Analyze patterns at different scales
  const scaleAnalysis = {};
  for (const [scaleName, scale] of Object.entries(aggregated.scales)) {
    const scores = scale.windows.map(w => w.avgScore);
    scaleAnalysis[scaleName] = {
      windowCount: scale.windows.length,
      coherence: scale.coherence,
      scoreRange: scores.length > 0 ? {
        min: Math.min(...scores),
        max: Math.max(...scores),
        mean: calculateMean(scores)
      } : null,
      variance: scores.length > 0 ? calculateVariance(scores) : 0
    };
  }
  
  // Check if different scales show different patterns
  const immediateVariance = scaleAnalysis.immediate?.variance || 0;
  const longVariance = scaleAnalysis.long?.variance || 0;
  const varianceDifference = Math.abs(immediateVariance - longVariance);
  
  return {
    hypothesis: 'Multi-scale aggregation captures different patterns',
    scaleAnalysis,
    varianceDifference,
    conclusion: varianceDifference > 0.1 ? 'SUPPORTED' : 'NOT SUPPORTED'
  };
}

/**
 * Hypothesis 3: Human perception time aligns with research
 */
function testHumanPerceptionTime() {
  console.log('📊 Hypothesis 3: Human perception time aligns with research\n');
  
  const tests = [
    {
      action: 'visual-appeal',
      expected: { min: 50, max: 200 },
      description: 'Visual appeal decision (50ms research)'
    },
    {
      action: 'interaction',
      expected: { min: 500, max: 2000 },
      description: 'Quick interaction (1s research)'
    },
    {
      action: 'reading',
      context: { contentLength: 500 },
      expected: { min: 2000, max: 10000 },
      description: 'Reading 500 chars (~100 words)'
    },
    {
      action: 'reading',
      context: { contentLength: 2000 },
      expected: { min: 8000, max: 30000 },
      description: 'Reading 2000 chars (~400 words)'
    }
  ];
  
  const results = tests.map(test => {
    const time = humanPerceptionTime(test.action, test.context || {});
    const withinRange = time >= test.expected.min && time <= test.expected.max;
    
    return {
      ...test,
      actualTime: time,
      withinRange,
      deviation: withinRange ? 0 : Math.min(
        Math.abs(time - test.expected.min),
        Math.abs(time - test.expected.max)
      )
    };
  });
  
  const alignmentRate = results.filter(r => r.withinRange).length / results.length;
  
  return {
    hypothesis: 'Human perception time aligns with research',
    results,
    alignmentRate,
    conclusion: alignmentRate >= 0.75 ? 'SUPPORTED' : 'PARTIALLY SUPPORTED'
  };
}

/**
 * Hypothesis 4: Attention affects temporal perception
 */
function testAttentionEffects() {
  console.log('📊 Hypothesis 4: Attention affects temporal perception\n');
  
  const baseTime = humanPerceptionTime('interaction', {
    attentionLevel: 'normal',
    actionComplexity: 'normal'
  });
  
  const focusedTime = humanPerceptionTime('interaction', {
    attentionLevel: 'focused',
    actionComplexity: 'normal'
  });
  
  const distractedTime = humanPerceptionTime('interaction', {
    attentionLevel: 'distracted',
    actionComplexity: 'normal'
  });
  
  const focusedReduction = ((baseTime - focusedTime) / baseTime) * 100;
  const distractedIncrease = ((distractedTime - baseTime) / baseTime) * 100;
  
  return {
    hypothesis: 'Attention affects temporal perception',
    baseTime,
    focusedTime,
    distractedTime,
    focusedReduction,
    distractedIncrease,
    conclusion: (focusedTime < baseTime && distractedTime > baseTime) ? 'SUPPORTED' : 'NOT SUPPORTED'
  };
}

/**
 * Run all experiments and generate report
 */
function runDataDrivenAnalysis() {
  console.log('🔬 Data-Driven Analysis Framework\n');
  console.log('Running systematic experiments...\n');
  
  const experiments = {
    timestamp: new Date().toISOString(),
    hypotheses: {}
  };
  
  // Run experiments
  experiments.hypotheses.sequentialConsistency = testSequentialConsistency();
  experiments.hypotheses.multiScalePatterns = testMultiScalePatterns();
  experiments.hypotheses.humanPerceptionTime = testHumanPerceptionTime();
  experiments.hypotheses.attentionEffects = testAttentionEffects();
  
  // Generate summary
  const summary = {
    totalHypotheses: Object.keys(experiments.hypotheses).length,
    supported: Object.values(experiments.hypotheses).filter(h => h.conclusion === 'SUPPORTED').length,
    partiallySupported: Object.values(experiments.hypotheses).filter(h => h.conclusion === 'PARTIALLY SUPPORTED').length,
    notSupported: Object.values(experiments.hypotheses).filter(h => h.conclusion === 'NOT SUPPORTED').length
  };
  
  // Generate report
  const report = generateReport(experiments, summary);
  
  // Save results
  const timestamp = Date.now();
  const resultsFile = join(RESULTS_DIR, `data-driven-analysis-${timestamp}.json`);
  const reportFile = join(ANALYSIS_DIR, `data-driven-report-${timestamp}.md`);
  
  writeFileSync(resultsFile, JSON.stringify(experiments, null, 2));
  writeFileSync(reportFile, report);
  
  console.log('\n📊 Summary\n');
  console.log(`Total hypotheses: ${summary.totalHypotheses}`);
  console.log(`Supported: ${summary.supported}`);
  console.log(`Partially supported: ${summary.partiallySupported}`);
  console.log(`Not supported: ${summary.notSupported}`);
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  console.log(`📄 Report saved to: ${reportFile}`);
  
  return { experiments, summary, report };
}

/**
 * Generate markdown report
 */
function generateReport(experiments, summary) {
  const lines = [];
  
  lines.push('# Data-Driven Analysis Report');
  lines.push(`\nGenerated: ${new Date().toISOString()}\n`);
  lines.push('## Summary\n');
  lines.push(`- Total hypotheses: ${summary.totalHypotheses}`);
  lines.push(`- Supported: ${summary.supported}`);
  lines.push(`- Partially supported: ${summary.partiallySupported}`);
  lines.push(`- Not supported: ${summary.notSupported}\n`);
  
  for (const [name, hypothesis] of Object.entries(experiments.hypotheses)) {
    lines.push(`## ${hypothesis.hypothesis}\n`);
    lines.push(`**Conclusion:** ${hypothesis.conclusion}\n`);
    
    if (hypothesis.improvement !== undefined) {
      lines.push(`- Improvement: ${hypothesis.improvement.toFixed(2)}%`);
      lines.push(`- Isolated variance: ${hypothesis.isolated.variance.toFixed(3)}`);
      lines.push(`- Sequential variance: ${hypothesis.sequential.variance.toFixed(3)}`);
    }
    
    if (hypothesis.alignmentRate !== undefined) {
      lines.push(`- Alignment rate: ${(hypothesis.alignmentRate * 100).toFixed(1)}%`);
    }
    
    if (hypothesis.focusedReduction !== undefined) {
      lines.push(`- Focused reduction: ${hypothesis.focusedReduction.toFixed(1)}%`);
      lines.push(`- Distracted increase: ${hypothesis.distractedIncrease.toFixed(1)}%`);
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Calculate variance
 */
function calculateVariance(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
}

/**
 * Calculate mean
 */
function calculateMean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDataDrivenAnalysis();
}

export { runDataDrivenAnalysis };

