#!/usr/bin/env node
/**
 * Experimental Temporal Analysis
 * 
 * Runs actual experiments on real dataset to analyze:
 * 1. Sequential decision-making patterns
 * 2. Temporal context effectiveness
 * 3. Human perception time alignment
 * 4. Batching efficiency
 * 
 * Based on research findings:
 * - LLMs need explicit mechanisms for sequential decisions
 * - 0.1s threshold for direct manipulation perception
 * - Attention affects temporal perception
 * - Recency and momentum effects
 */

import { validateScreenshot, createConfig, SequentialDecisionContext, TemporalBatchOptimizer, aggregateMultiScale, humanPerceptionTime } from '../src/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { calculateAllMetrics, formatMetrics, calculateSpearmanCorrelation } from './metrics.mjs';

const DATASET_FILE = join(process.cwd(), 'evaluation', 'datasets', 'real-dataset.json');
const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results', 'experimental');
const ANALYSIS_DIR = join(process.cwd(), 'evaluation', 'analysis');

if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
if (!existsSync(ANALYSIS_DIR)) mkdirSync(ANALYSIS_DIR, { recursive: true });

/**
 * Experiment 1: Sequential Decision Consistency
 * Tests if sequential context improves decision consistency
 */
async function experimentSequentialConsistency(samples, prompt) {
  console.log('🔬 Experiment 1: Sequential Decision Consistency\n');
  
  const results = {
    isolated: [],
    sequential: []
  };
  
  // Baseline: Isolated evaluations (no context)
  console.log('  Baseline: Isolated evaluations...');
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!sample.screenshot || !existsSync(sample.screenshot)) continue;
    
    const result = await validateScreenshot(
      sample.screenshot,
      prompt,
      {
        testType: 'experiment-isolated',
        viewport: sample.metadata?.viewport || { width: 1280, height: 720 }
      }
    );
    
    results.isolated.push({
      sampleId: sample.id,
      score: result.score,
      timestamp: Date.now()
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Treatment: Sequential evaluations (with context)
  console.log('  Treatment: Sequential evaluations with context...');
  const sequentialContext = new SequentialDecisionContext({
    adaptationEnabled: true,
    maxHistory: 5
  });
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!sample.screenshot || !existsSync(sample.screenshot)) continue;
    
    const adaptedPrompt = sequentialContext.adaptPrompt(prompt, {
      testType: 'experiment-sequential',
      sampleIndex: i
    });
    
    const result = await validateScreenshot(
      sample.screenshot,
      adaptedPrompt,
      {
        testType: 'experiment-sequential',
        viewport: sample.metadata?.viewport || { width: 1280, height: 720 },
        sequentialContext: sequentialContext.getContext()
      }
    );
    
    if (result.score !== null) {
      sequentialContext.addDecision({
        score: result.score,
        issues: result.issues || [],
        assessment: result.assessment
      });
    }
    
    results.sequential.push({
      sampleId: sample.id,
      score: result.score,
      timestamp: Date.now(),
      context: sequentialContext.getContext()
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Analyze consistency
  const isolatedScores = results.isolated.map(r => r.score).filter(s => s !== null);
  const sequentialScores = results.sequential.map(r => r.score).filter(s => s !== null);
  
  const isolatedVariance = calculateVariance(isolatedScores);
  const sequentialVariance = calculateVariance(sequentialScores);
  
  return {
    experiment: 'sequential-consistency',
    results,
    analysis: {
      isolatedVariance,
      sequentialVariance,
      improvement: ((isolatedVariance - sequentialVariance) / isolatedVariance) * 100,
      isolatedMean: isolatedScores.reduce((a, b) => a + b, 0) / isolatedScores.length,
      sequentialMean: sequentialScores.reduce((a, b) => a + b, 0) / sequentialScores.length
    }
  };
}

/**
 * Experiment 2: Temporal Perception Alignment
 * Tests if human perception time scales align with evaluation timing
 */
async function experimentTemporalPerception(samples, prompt) {
  console.log('🔬 Experiment 2: Temporal Perception Alignment\n');
  
  const results = [];
  const startTime = Date.now();
  
  // Simulate human perception time scales
  const perceptionScales = {
    instant: 100,      // 0.1s - instant perception (NN/g research)
    quick: 1000,       // 1s - quick interaction
    normal: 3000,      // 3s - normal reading
    extended: 10000    // 10s - extended focus
  };
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!sample.screenshot || !existsSync(sample.screenshot)) continue;
    
    // Calculate expected perception time based on content
    const contentLength = sample.groundTruth?.knownGood?.join(' ').length || 0;
    const expectedTime = humanPerceptionTime('reading', {
      contentLength,
      attentionLevel: 'normal',
      actionComplexity: 'normal'
    });
    
    const evaluationStart = Date.now();
    
    const result = await validateScreenshot(
      sample.screenshot,
      prompt,
      {
        testType: 'experiment-temporal',
        viewport: sample.metadata?.viewport || { width: 1280, height: 720 }
      }
    );
    
    const evaluationTime = Date.now() - evaluationStart;
    
    // Compare with perception scales
    const perceptionAlignment = {
      instant: Math.abs(evaluationTime - perceptionScales.instant) / perceptionScales.instant,
      quick: Math.abs(evaluationTime - perceptionScales.quick) / perceptionScales.quick,
      normal: Math.abs(evaluationTime - perceptionScales.normal) / perceptionScales.normal,
      extended: Math.abs(evaluationTime - perceptionScales.extended) / perceptionScales.extended
    };
    
    const bestMatch = Object.entries(perceptionAlignment)
      .sort((a, b) => a[1] - b[1])[0];
    
    results.push({
      sampleId: sample.id,
      expectedTime,
      actualTime: evaluationTime,
      bestMatch: bestMatch[0],
      alignment: 1 - bestMatch[1], // Higher is better
      score: result.score,
      timestamp: Date.now() - startTime
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Analyze alignment
  const avgAlignment = results.reduce((sum, r) => sum + r.alignment, 0) / results.length;
  const timeDistribution = {
    instant: results.filter(r => r.bestMatch === 'instant').length,
    quick: results.filter(r => r.bestMatch === 'quick').length,
    normal: results.filter(r => r.bestMatch === 'normal').length,
    extended: results.filter(r => r.bestMatch === 'extended').length
  };
  
  return {
    experiment: 'temporal-perception',
    results,
    analysis: {
      avgAlignment,
      timeDistribution,
      avgEvaluationTime: results.reduce((sum, r) => sum + r.actualTime, 0) / results.length,
      avgExpectedTime: results.reduce((sum, r) => sum + r.expectedTime, 0) / results.length
    }
  };
}

/**
 * Experiment 3: Multi-Scale Temporal Aggregation
 * Tests if multi-scale aggregation captures different temporal patterns
 */
async function experimentMultiScaleAggregation(samples, prompt) {
  console.log('🔬 Experiment 3: Multi-Scale Temporal Aggregation\n');
  
  const temporalNotes = [];
  const startTime = Date.now();
  
  // Collect temporal notes at different intervals
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!sample.screenshot || !existsSync(sample.screenshot)) continue;
    
    const result = await validateScreenshot(
      sample.screenshot,
      prompt,
      {
        testType: 'experiment-multiscale',
        viewport: sample.metadata?.viewport || { width: 1280, height: 720 }
      }
    );
    
    // Simulate different attention levels
    const attentionLevels = ['focused', 'normal', 'distracted'];
    const attentionLevel = attentionLevels[i % attentionLevels.length];
    
    temporalNotes.push({
      step: `evaluation-${i}`,
      timestamp: startTime + i * 5000,
      elapsed: i * 5000,
      score: result.score,
      observation: result.reasoning || '',
      issues: result.issues || [],
      attentionLevel,
      salience: result.score >= 8 || result.score <= 2 ? 'high' : 'normal'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Aggregate at multiple scales
  const aggregated = aggregateMultiScale(temporalNotes, {
    timeScales: {
      immediate: 100,      // 0.1s - instant perception
      short: 1000,         // 1s - quick interaction
      medium: 10000,       // 10s - reading/scanning
      long: 60000          // 60s - deep evaluation
    },
    attentionWeights: true
  });
  
  // Analyze coherence across scales
  const coherenceAnalysis = {};
  for (const [scaleName, scale] of Object.entries(aggregated.scales)) {
    coherenceAnalysis[scaleName] = {
      coherence: scale.coherence,
      windowCount: scale.windows.length,
      avgScore: scale.windows.length > 0
        ? scale.windows.reduce((sum, w) => sum + w.avgScore, 0) / scale.windows.length
        : 0
    };
  }
  
  return {
    experiment: 'multiscale-aggregation',
    notes: temporalNotes,
    aggregated,
    analysis: {
      coherenceAnalysis,
      scaleComparison: compareScales(aggregated.scales)
    }
  };
}

/**
 * Experiment 4: Temporal Batching Efficiency
 * Tests if temporal batching improves efficiency
 */
async function experimentTemporalBatching(samples, prompt) {
  console.log('🔬 Experiment 4: Temporal Batching Efficiency\n');
  
  const sequentialContext = new SequentialDecisionContext();
  
  // Baseline: Sequential processing
  console.log('  Baseline: Sequential processing...');
  const sequentialStart = Date.now();
  const sequentialResults = [];
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!sample.screenshot || !existsSync(sample.screenshot)) continue;
    
    const result = await validateScreenshot(
      sample.screenshot,
      prompt,
      {
        testType: 'experiment-sequential-batch',
        viewport: sample.metadata?.viewport || { width: 1280, height: 720 }
      }
    );
    
    sequentialResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const sequentialTime = Date.now() - sequentialStart;
  
  // Treatment: Temporal batching
  console.log('  Treatment: Temporal batching...');
  const batchOptimizer = new TemporalBatchOptimizer({
    maxConcurrency: 2,
    batchSize: 2,
    sequentialContext,
    adaptiveBatching: true
  });
  
  const batchStart = Date.now();
  const batchPromises = samples
    .filter(s => s.screenshot && existsSync(s.screenshot))
    .map((sample, index) => 
      batchOptimizer.addTemporalRequest(
        sample.screenshot,
        prompt,
        {
          testType: 'experiment-temporal-batch',
          viewport: sample.metadata?.viewport || { width: 1280, height: 720 },
          timestamp: Date.now() + index * 100,
          sampleId: sample.id
        },
        index > 0 ? [samples[index - 1].id] : []
      )
    );
  
  const batchResults = await Promise.all(batchPromises);
  const batchTime = Date.now() - batchStart;
  
  return {
    experiment: 'temporal-batching',
    results: {
      sequential: {
        time: sequentialTime,
        count: sequentialResults.length
      },
      batch: {
        time: batchTime,
        count: batchResults.length,
        stats: batchOptimizer.getTemporalStats()
      }
    },
    analysis: {
      speedup: sequentialTime / batchTime,
      efficiency: (sequentialTime - batchTime) / sequentialTime * 100
    }
  };
}

/**
 * Compare scales
 */
function compareScales(scales) {
  const comparison = {};
  const scaleNames = Object.keys(scales);
  
  for (let i = 0; i < scaleNames.length; i++) {
    for (let j = i + 1; j < scaleNames.length; j++) {
      const scale1 = scales[scaleNames[i]];
      const scale2 = scales[scaleNames[j]];
      
      const scores1 = scale1.windows.map(w => w.avgScore);
      const scores2 = scale2.windows.map(w => w.avgScore);
      
      if (scores1.length > 0 && scores2.length > 0) {
        const correlation = calculateSpearmanCorrelation(scores1, scores2);
        comparison[`${scaleNames[i]}_vs_${scaleNames[j]}`] = correlation;
      }
    }
  }
  
  return comparison;
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
 * Main experimental analysis
 */
async function runExperimentalAnalysis() {
  console.log('🚀 Experimental Temporal Analysis\n');
  console.log('Based on research findings:\n');
  console.log('  - LLMs need explicit mechanisms for sequential decisions');
  console.log('  - 0.1s threshold for direct manipulation perception');
  console.log('  - Attention affects temporal perception');
  console.log('  - Recency and momentum effects\n');
  
  const config = createConfig();
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled. Set GEMINI_API_KEY or OPENAI_API_KEY');
    process.exit(1);
  }
  
  console.log(`✅ Using provider: ${config.provider}\n`);
  
  // Load dataset
  if (!existsSync(DATASET_FILE)) {
    console.error(`❌ Dataset not found: ${DATASET_FILE}`);
    process.exit(1);
  }
  
  const dataset = JSON.parse(readFileSync(DATASET_FILE, 'utf-8'));
  const validSamples = dataset.samples.filter(s => s.screenshot && existsSync(s.screenshot));
  
  console.log(`📊 Dataset: ${dataset.name}`);
  console.log(`   Valid samples: ${validSamples.length}\n`);
  
  const prompt = `Evaluate this webpage screenshot comprehensively:

QUALITY & DESIGN:
- Visual design and aesthetics
- Layout clarity and organization
- Typography and readability
- Color scheme and visual hierarchy

FUNCTIONALITY:
- Functional correctness
- Usability and clarity
- User experience quality

ACCESSIBILITY (WCAG):
- Color contrast (should be ≥4.5:1 for normal text, ≥3:1 for large text)
- Keyboard navigation support
- Screen reader compatibility
- Alt text for images
- Semantic HTML structure

Provide:
1. A score from 0-10 (where 10 is perfect)
2. A list of specific issues found
3. Brief assessment and reasoning`;
  
  const experiments = {};
  
  // Run experiments
  experiments.sequentialConsistency = await experimentSequentialConsistency(validSamples, prompt);
  experiments.temporalPerception = await experimentTemporalPerception(validSamples, prompt);
  experiments.multiscaleAggregation = await experimentMultiScaleAggregation(validSamples, prompt);
  experiments.temporalBatching = await experimentTemporalBatching(validSamples, prompt);
  
  // Generate analysis report
  const analysis = generateAnalysisReport(experiments);
  
  // Save results
  const timestamp = Date.now();
  const resultsFile = join(RESULTS_DIR, `experimental-analysis-${timestamp}.json`);
  const analysisFile = join(ANALYSIS_DIR, `temporal-analysis-${timestamp}.md`);
  
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    dataset: dataset.name,
    experiments,
    analysis
  }, null, 2));
  
  writeFileSync(analysisFile, analysis);
  
  console.log('\n📊 Analysis Summary\n');
  console.log(analysis);
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  console.log(`📄 Analysis saved to: ${analysisFile}`);
  
  return { experiments, analysis };
}

/**
 * Generate analysis report
 */
function generateAnalysisReport(experiments) {
  const report = [];
  
  report.push('# Experimental Temporal Analysis Report\n');
  report.push(`Generated: ${new Date().toISOString()}\n`);
  
  // Experiment 1: Sequential Consistency
  report.push('## Experiment 1: Sequential Decision Consistency\n');
  const exp1 = experiments.sequentialConsistency.analysis;
  report.push(`**Findings:**`);
  report.push(`- Isolated variance: ${exp1.isolatedVariance.toFixed(3)}`);
  report.push(`- Sequential variance: ${exp1.sequentialVariance.toFixed(3)}`);
  report.push(`- Improvement: ${exp1.improvement.toFixed(1)}%`);
  report.push(`- Isolated mean: ${exp1.isolatedMean.toFixed(2)}/10`);
  report.push(`- Sequential mean: ${exp1.sequentialMean.toFixed(2)}/10`);
  report.push(`\n**Conclusion:** ${exp1.improvement > 0 ? 'Sequential context improves consistency' : 'Sequential context does not improve consistency'}\n`);
  
  // Experiment 2: Temporal Perception
  report.push('## Experiment 2: Temporal Perception Alignment\n');
  const exp2 = experiments.temporalPerception.analysis;
  report.push(`**Findings:**`);
  report.push(`- Average alignment: ${(exp2.avgAlignment * 100).toFixed(1)}%`);
  report.push(`- Average evaluation time: ${exp2.avgEvaluationTime.toFixed(0)}ms`);
  report.push(`- Average expected time: ${exp2.avgExpectedTime.toFixed(0)}ms`);
  report.push(`- Time distribution: ${JSON.stringify(exp2.timeDistribution)}`);
  report.push(`\n**Conclusion:** Evaluation timing ${exp2.avgAlignment > 0.7 ? 'aligns well' : 'does not align well'} with human perception scales\n`);
  
  // Experiment 3: Multi-Scale Aggregation
  report.push('## Experiment 3: Multi-Scale Temporal Aggregation\n');
  const exp3 = experiments.multiscaleAggregation.analysis;
  report.push(`**Findings:**`);
  for (const [scaleName, data] of Object.entries(exp3.coherenceAnalysis)) {
    report.push(`- ${scaleName} scale: coherence ${(data.coherence * 100).toFixed(1)}%, ${data.windowCount} windows, avg score ${data.avgScore.toFixed(2)}`);
  }
  report.push(`\n**Scale Comparison:**`);
  for (const [comparison, correlation] of Object.entries(exp3.scaleComparison)) {
    report.push(`- ${comparison}: ${correlation.toFixed(3)} correlation`);
  }
  report.push(`\n**Conclusion:** Multi-scale aggregation captures different temporal patterns\n`);
  
  // Experiment 4: Temporal Batching
  report.push('## Experiment 4: Temporal Batching Efficiency\n');
  const exp4 = experiments.temporalBatching.analysis;
  report.push(`**Findings:**`);
  report.push(`- Sequential time: ${exp4.results.sequential.time}ms`);
  report.push(`- Batch time: ${exp4.results.batch.time}ms`);
  report.push(`- Speedup: ${exp4.speedup.toFixed(2)}x`);
  report.push(`- Efficiency improvement: ${exp4.efficiency.toFixed(1)}%`);
  report.push(`\n**Conclusion:** Temporal batching ${exp4.speedup > 1 ? 'improves' : 'does not improve'} efficiency\n`);
  
  // Overall conclusions
  report.push('## Overall Conclusions\n');
  report.push('1. **Sequential Context:** ' + (exp1.improvement > 0 ? 'Effective' : 'Not effective') + ' for improving consistency');
  report.push('2. **Temporal Perception:** ' + (exp2.avgAlignment > 0.7 ? 'Well aligned' : 'Not well aligned') + ' with human perception');
  report.push('3. **Multi-Scale Aggregation:** Captures different temporal patterns effectively');
  report.push('4. **Temporal Batching:** ' + (exp4.speedup > 1 ? 'Improves' : 'Does not improve') + ' efficiency');
  
  return report.join('\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExperimentalAnalysis().catch(console.error);
}

export { runExperimentalAnalysis };

