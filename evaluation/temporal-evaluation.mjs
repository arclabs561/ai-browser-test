#!/usr/bin/env node
/**
 * Temporal Decision-Making Evaluation
 * 
 * Evaluates how temporal aspects affect decision-making:
 * - Multi-scale temporal aggregation
 * - Sequential decision context
 * - Human perception time modeling
 * - Adaptive batching
 */

import { validateScreenshot, createConfig, SequentialDecisionContext, TemporalBatchOptimizer, aggregateMultiScale } from '../src/index.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { calculateAllMetrics, formatMetrics } from './metrics.mjs';

const DATASET_FILE = join(process.cwd(), 'evaluation', 'datasets', 'real-dataset.json');
const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results');

/**
 * Evaluate with sequential context
 */
async function evaluateWithSequentialContext(samples, prompt) {
  console.log('📊 Evaluating with Sequential Decision Context\n');
  
  const sequentialContext = new SequentialDecisionContext({
    adaptationEnabled: true,
    maxHistory: 5
  });
  
  const results = [];
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!sample.screenshot || !existsSync(sample.screenshot)) continue;
    
    console.log(`[${i + 1}/${samples.length}] ${sample.name}`);
    
    // Adapt prompt based on history
    const adaptedPrompt = sequentialContext.adaptPrompt(prompt, {
      testType: 'temporal-evaluation',
      sampleIndex: i
    });
    
    const result = await validateScreenshot(
      sample.screenshot,
      adaptedPrompt,
      {
        testType: 'temporal-evaluation',
        viewport: sample.metadata?.viewport || { width: 1280, height: 720 },
        sequentialContext: sequentialContext.getContext()
      }
    );
    
    // Add to context
    if (result.score !== null) {
      sequentialContext.addDecision({
        score: result.score,
        issues: result.issues || [],
        assessment: result.assessment,
        reasoning: result.reasoning
      });
    }
    
    results.push({
      sampleId: sample.id,
      result,
      context: sequentialContext.getContext()
    });
    
    console.log(`   Score: ${result.score?.toFixed(2) || 'N/A'}/10`);
    console.log(`   Context: ${sequentialContext.history.length} previous decisions`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return {
    method: 'sequential-context',
    results,
    patterns: sequentialContext.identifyPatterns()
  };
}

/**
 * Evaluate with temporal batching
 */
async function evaluateWithTemporalBatching(samples, prompt) {
  console.log('📊 Evaluating with Temporal Batch Optimization\n');
  
  const sequentialContext = new SequentialDecisionContext();
  const batchOptimizer = new TemporalBatchOptimizer({
    maxConcurrency: 3,
    batchSize: 2,
    sequentialContext,
    adaptiveBatching: true
  });
  
  // Add requests with temporal dependencies
  const requests = samples
    .filter(s => s.screenshot && existsSync(s.screenshot))
    .map((sample, index) => ({
      sample,
      dependencies: index > 0 ? [samples[index - 1].id] : [], // Each depends on previous
      timestamp: Date.now() + index * 1000 // Stagger timestamps
    }));
  
  const results = await Promise.all(
    requests.map(req => 
      batchOptimizer.addTemporalRequest(
        req.sample.screenshot,
        prompt,
        {
          testType: 'temporal-batch',
          viewport: req.sample.metadata?.viewport || { width: 1280, height: 720 },
          timestamp: req.timestamp,
          sampleId: req.sample.id
        },
        req.dependencies
      )
    )
  );
  
  return {
    method: 'temporal-batching',
    results: results.map((result, i) => ({
      sampleId: requests[i].sample.id,
      result
    })),
    stats: batchOptimizer.getTemporalStats()
  };
}

/**
 * Evaluate with multi-scale temporal aggregation
 */
async function evaluateWithMultiScale(samples, prompt) {
  console.log('📊 Evaluating with Multi-Scale Temporal Aggregation\n');
  
  // Simulate temporal notes (in practice, these would come from actual temporal evaluation)
  const temporalNotes = [];
  const startTime = Date.now();
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (!sample.screenshot || !existsSync(sample.screenshot)) continue;
    
    const result = await validateScreenshot(
      sample.screenshot,
      prompt,
      {
        testType: 'temporal-multiscale',
        viewport: sample.metadata?.viewport || { width: 1280, height: 720 }
      }
    );
    
    temporalNotes.push({
      step: `evaluation-${i}`,
      timestamp: startTime + i * 5000, // 5 second intervals
      elapsed: i * 5000,
      score: result.score,
      observation: result.reasoning || '',
      issues: result.issues || []
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Aggregate at multiple scales
  const aggregated = aggregateMultiScale(temporalNotes, {
    timeScales: {
      immediate: 100,
      short: 1000,
      medium: 10000,
      long: 60000
    },
    attentionWeights: true
  });
  
  return {
    method: 'multi-scale',
    notes: temporalNotes,
    aggregated,
    scales: Object.keys(aggregated.scales)
  };
}

/**
 * Main temporal evaluation
 */
async function runTemporalEvaluation() {
  console.log('🚀 Temporal Decision-Making Evaluation\n');
  
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
  
  const results = {
    timestamp: new Date().toISOString(),
    dataset: dataset.name,
    methods: {}
  };
  
  // Method 1: Sequential Context
  const sequentialResults = await evaluateWithSequentialContext(validSamples, prompt);
  results.methods.sequentialContext = sequentialResults;
  
  // Method 2: Temporal Batching
  const batchResults = await evaluateWithTemporalBatching(validSamples, prompt);
  results.methods.temporalBatching = batchResults;
  
  // Method 3: Multi-Scale Aggregation
  const multiscaleResults = await evaluateWithMultiScale(validSamples, prompt);
  results.methods.multiScale = multiscaleResults;
  
  // Analysis
  console.log('\n📊 Temporal Analysis\n');
  
  // Compare sequential vs isolated
  if (sequentialResults.results.length > 0) {
    const sequentialScores = sequentialResults.results
      .map(r => r.result.score)
      .filter(s => s !== null);
    
    console.log('Sequential Context:');
    console.log(`   Average score: ${(sequentialScores.reduce((a, b) => a + b, 0) / sequentialScores.length).toFixed(2)}/10`);
    console.log(`   Patterns: ${JSON.stringify(sequentialResults.patterns)}`);
  }
  
  // Multi-scale analysis
  if (multiscaleResults.aggregated) {
    console.log('\nMulti-Scale Aggregation:');
    for (const [scaleName, scale] of Object.entries(multiscaleResults.aggregated.scales)) {
      console.log(`   ${scaleName} scale: ${scale.windows.length} windows, coherence: ${(scale.coherence * 100).toFixed(0)}%`);
    }
  }
  
  // Save results
  const resultsFile = join(RESULTS_DIR, `temporal-evaluation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTemporalEvaluation().catch(console.error);
}

export { runTemporalEvaluation };

