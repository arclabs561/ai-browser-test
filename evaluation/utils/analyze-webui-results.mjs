#!/usr/bin/env node
/**
 * Analyze WebUI Evaluation Results
 * 
 * Provides insights and analysis on WebUI evaluation results.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results');

/**
 * Load latest WebUI evaluation result
 */
function loadLatestResult() {
  const files = readdirSync(RESULTS_DIR)
    .filter(f => f.startsWith('webui-evaluation-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: join(RESULTS_DIR, f),
      mtime: statSync(join(RESULTS_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  if (files.length === 0) {
    return null;
  }
  
  return JSON.parse(readFileSync(files[0].path, 'utf-8'));
}

/**
 * Analyze results
 */
function analyzeResults(result) {
  console.log('📊 WebUI Evaluation Analysis\n');
  
  console.log(`Dataset: ${result.dataset}`);
  console.log(`Total Samples: ${result.totalSamples}`);
  console.log(`Success: ${result.success}`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Skipped: ${result.skipped}`);
  console.log(`Average Score: ${result.averageScore.toFixed(2)}/10\n`);
  
  // Score distribution
  const scores = result.results
    .filter(r => r.status === 'success' && r.score !== undefined)
    .map(r => r.score);
  
  if (scores.length > 0) {
    scores.sort((a, b) => a - b);
    const min = scores[0];
    const max = scores[scores.length - 1];
    const median = scores[Math.floor(scores.length / 2)];
    const q1 = scores[Math.floor(scores.length / 4)];
    const q3 = scores[Math.floor(scores.length * 3 / 4)];
    
    console.log('Score Distribution:');
    console.log(`  Min: ${min}/10`);
    console.log(`  Q1: ${q1}/10`);
    console.log(`  Median: ${median}/10`);
    console.log(`  Q3: ${q3}/10`);
    console.log(`  Max: ${max}/10\n`);
  }
  
  // Ground truth coverage
  const withAxtree = result.results.filter(r => r.hasGroundTruth?.accessibilityTree).length;
  const withBoxes = result.results.filter(r => r.hasGroundTruth?.boundingBoxes).length;
  const withStyles = result.results.filter(r => r.hasGroundTruth?.styles).length;
  
  console.log('Ground Truth Coverage:');
  console.log(`  Accessibility Trees: ${withAxtree}/${result.totalSamples}`);
  console.log(`  Bounding Boxes: ${withBoxes}/${result.totalSamples}`);
  console.log(`  Styles: ${withStyles}/${result.totalSamples}\n`);
  
  // Common issues
  const allIssues = result.results
    .filter(r => r.issues && r.issues.length > 0)
    .flatMap(r => r.issues);
  
  if (allIssues.length > 0) {
    const issueCounts = {};
    allIssues.forEach(issue => {
      const key = issue.toLowerCase();
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    });
    
    const topIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    console.log('Top Issues Found:');
    topIssues.forEach(([issue, count]) => {
      console.log(`  - ${issue}: ${count} occurrences`);
    });
  }
}

async function main() {
  const result = loadLatestResult();
  
  if (!result) {
    console.log('❌ No WebUI evaluation results found');
    console.log('   Run: node evaluation/runners/run-webui-evaluation.mjs first');
    return;
  }
  
  analyzeResults(result);
}

main().catch(console.error);

