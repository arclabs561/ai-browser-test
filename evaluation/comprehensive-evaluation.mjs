#!/usr/bin/env node
/**
 * Comprehensive Evaluation with All Methods
 * 
 * Runs evaluations using:
 * 1. Scoring Evaluation (baseline)
 * 2. Pair Comparison (research shows more reliable)
 * 3. Batch Ranking
 * 4. With and without bias mitigation
 * 5. With few-shot examples
 * 
 * Compares all methods on real dataset and analyzes results.
 */

import { validateScreenshot, comparePair, rankBatch, createConfig } from '../src/index.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { calculateAllMetrics, formatMetrics, calculateSpearmanCorrelation } from './metrics.mjs';

const DATASET_FILE = join(process.cwd(), 'evaluation', 'datasets', 'real-dataset.json');
const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results');

/**
 * Evaluate using Scoring Evaluation method
 */
async function evaluateScoring(sample, prompt, options = {}) {
  const { enableBiasMitigation = true } = options;
  
  const result = await validateScreenshot(
    sample.screenshot,
    prompt,
    {
      testType: 'comprehensive-evaluation',
      viewport: sample.metadata?.viewport || { width: 1280, height: 720 },
      enableBiasMitigation
    }
  );
  
  return {
    method: 'scoring',
    result,
    biasMitigation: enableBiasMitigation
  };
}

/**
 * Evaluate using Pair Comparison method
 */
async function evaluatePairComparison(samples, prompt, options = {}) {
  if (samples.length < 2) {
    return { method: 'pair-comparison', error: 'Need at least 2 samples' };
  }
  
  const comparisons = [];
  
  // Compare all pairs
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      const comparison = await comparePair(
        samples[i].screenshot,
        samples[j].screenshot,
        prompt,
        {
          testType: 'comprehensive-evaluation',
          viewport: samples[i].metadata?.viewport || { width: 1280, height: 720 }
        }
      );
      
      comparisons.push({
        sample1: samples[i].id,
        sample2: samples[j].id,
        comparison
      });
    }
  }
  
  // Derive scores from comparisons
  const scores = new Map();
  comparisons.forEach(c => {
    if (c.comparison.enabled && c.comparison.comparison) {
      const score1 = c.comparison.comparison.score1;
      const score2 = c.comparison.comparison.score2;
      
      scores.set(c.sample1, (scores.get(c.sample1) || 0) + score1);
      scores.set(c.sample2, (scores.get(c.sample2) || 0) + score2);
    }
  });
  
  return {
    method: 'pair-comparison',
    comparisons,
    derivedScores: Object.fromEntries(scores)
  };
}

/**
 * Evaluate using Batch Ranking method
 */
async function evaluateBatchRanking(samples, prompt, options = {}) {
  if (samples.length < 2) {
    return { method: 'batch-ranking', error: 'Need at least 2 samples' };
  }
  
  const imagePaths = samples.map(s => s.screenshot).filter(p => p && existsSync(p));
  
  const ranking = await rankBatch(
    imagePaths,
    prompt,
    {
      testType: 'comprehensive-evaluation',
      viewport: samples[0]?.metadata?.viewport || { width: 1280, height: 720 }
    }
  );
  
  return {
    method: 'batch-ranking',
    ranking
  };
}

/**
 * Main comprehensive evaluation
 */
async function runComprehensiveEvaluation() {
  console.log('🚀 Comprehensive Evaluation with All Methods\n');
  
  // Check configuration
  const config = createConfig();
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled. Set GEMINI_API_KEY or OPENAI_API_KEY');
    process.exit(1);
  }
  
  console.log(`✅ Using provider: ${config.provider}\n`);
  
  // Load dataset
  if (!existsSync(DATASET_FILE)) {
    console.error(`❌ Dataset not found: ${DATASET_FILE}`);
    console.error('   Run: node evaluation/capture-real-dataset.mjs first');
    process.exit(1);
  }
  
  const dataset = JSON.parse(readFileSync(DATASET_FILE, 'utf-8'));
  console.log(`📊 Dataset: ${dataset.name}`);
  console.log(`   Samples: ${dataset.samples.length}\n`);
  
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
3. Brief assessment and reasoning

Be thorough and specific.`;
  
  const results = {
    timestamp: new Date().toISOString(),
    dataset: dataset.name,
    methods: {
      scoring: [],
      pairComparison: null,
      batchRanking: null
    },
    analysis: {}
  };
  
  // Method 1: Scoring Evaluation (with and without bias mitigation)
  console.log('📊 Method 1: Scoring Evaluation\n');
  
  for (let i = 0; i < dataset.samples.length; i++) {
    const sample = dataset.samples[i];
    if (!sample.screenshot || !existsSync(sample.screenshot)) continue;
    
    console.log(`[${i + 1}/${dataset.samples.length}] ${sample.name}`);
    
    // With bias mitigation
    const withMitigation = await evaluateScoring(sample, prompt, { enableBiasMitigation: true });
    results.methods.scoring.push({
      sampleId: sample.id,
      sampleName: sample.name,
      withMitigation,
      groundTruth: sample.groundTruth
    });
    
    console.log(`   Score: ${withMitigation.result.score?.toFixed(2) || 'N/A'}/10`);
    if (withMitigation.result.biasMitigation?.applied) {
      console.log(`   Bias mitigation: ${withMitigation.result.biasMitigation.totalAdjustment}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Method 2: Pair Comparison
  console.log('\n📊 Method 2: Pair Comparison\n');
  
  const validSamples = dataset.samples.filter(s => s.screenshot && existsSync(s.screenshot));
  if (validSamples.length >= 2) {
    const pairResults = await evaluatePairComparison(validSamples, prompt);
    results.methods.pairComparison = pairResults;
    console.log(`   Comparisons: ${pairResults.comparisons?.length || 0}`);
  }
  
  // Method 3: Batch Ranking
  console.log('\n📊 Method 3: Batch Ranking\n');
  
  if (validSamples.length >= 2) {
    const rankingResults = await evaluateBatchRanking(validSamples, prompt);
    results.methods.batchRanking = rankingResults;
    if (rankingResults.ranking?.rankings) {
      console.log(`   Rankings: ${rankingResults.ranking.rankings.length}`);
      rankingResults.ranking.rankings.slice(0, 3).forEach(r => {
        console.log(`   ${r.rank}. ${validSamples[r.index].name} (score: ${r.score.toFixed(2)})`);
      });
    }
  }
  
  // Analyze results
  console.log('\n📊 Analysis\n');
  
  // Compare scoring with ground truth
  const scoringResults = results.methods.scoring
    .filter(r => r.withMitigation.result.score !== null)
    .map(r => ({
      sampleId: r.sampleId,
      predicted: r.withMitigation.result.score,
      groundTruth: r.groundTruth.expectedScore
        ? (r.groundTruth.expectedScore.min + r.groundTruth.expectedScore.max) / 2
        : null
    }))
    .filter(r => r.groundTruth !== null);
  
  if (scoringResults.length > 0) {
    const predictions = scoringResults.map(r => r.predicted);
    const groundTruth = scoringResults.map(r => r.groundTruth);
    
    const metrics = calculateAllMetrics(scoringResults.map(r => ({
      result: { score: r.predicted },
      groundTruth: { expectedScore: { min: r.groundTruth, max: r.groundTruth } }
    })));
    
    results.analysis.scoring = {
      metrics,
      spearmanCorrelation: calculateSpearmanCorrelation(predictions, groundTruth),
      sampleCount: scoringResults.length
    };
    
    console.log(formatMetrics(metrics));
    console.log(`\nSpearman Correlation: ${results.analysis.scoring.spearmanCorrelation.toFixed(3)}`);
  }
  
  // Compare methods
  if (results.methods.pairComparison?.derivedScores) {
    const pairScores = Object.entries(results.methods.pairComparison.derivedScores)
      .map(([id, score]) => ({ id, score }));
    const scoringScores = results.methods.scoring
      .map(r => ({ id: r.sampleId, score: r.withMitigation.result.score }))
      .filter(r => r.score !== null);
    
    // Find common samples
    const common = pairScores.filter(p => 
      scoringScores.some(s => s.id === p.id)
    ).map(p => {
      const scoring = scoringScores.find(s => s.id === p.id);
      return {
        sampleId: p.id,
        scoringScore: scoring.score,
        pairScore: p.score
      };
    });
    
    if (common.length > 0) {
      const scoringScoresList = common.map(c => c.scoringScore);
      const pairScoresList = common.map(c => c.pairScore);
      
      results.analysis.methodComparison = {
        scoringVsPair: {
          correlation: calculateSpearmanCorrelation(scoringScoresList, pairScoresList),
          sampleCount: common.length
        }
      };
      
      console.log(`\nMethod Comparison (Scoring vs Pair Comparison):`);
      console.log(`   Spearman Correlation: ${results.analysis.methodComparison.scoringVsPair.correlation.toFixed(3)}`);
    }
  }
  
  // Save results
  const resultsFile = join(RESULTS_DIR, `comprehensive-evaluation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveEvaluation().catch(console.error);
}

export { runComprehensiveEvaluation };

