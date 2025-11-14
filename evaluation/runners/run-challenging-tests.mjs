#!/usr/bin/env node
/**
 * Run Challenging Website Tests
 * 
 * Progressive testing from medium to expert difficulty.
 * Validates system can handle increasingly complex websites.
 */

import { evaluateChallengingWebsites } from '../utils/expert-evaluation-scenarios.mjs';
import { CHALLENGING_WEBSITES, getWebsitesByDifficulty } from '../utils/challenging-websites.mjs';
import { getExpectedResults } from '../utils/challenging-websites.mjs';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results');
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Validate results against expectations
 */
function validateResults(results) {
  const validation = {
    total: results.length,
    passed: 0,
    failed: 0,
    details: []
  };
  
  for (const result of results) {
    if (result.error) {
      validation.failed++;
      validation.details.push({
        website: result.name,
        difficulty: result.difficulty,
        status: 'error',
        error: result.error
      });
      continue;
    }
    
    const website = CHALLENGING_WEBSITES.find(w => w.id === result.website);
    if (!website) continue;
    
    const expected = getExpectedResults(website);
    const scoreInRange = result.score >= expected.scoreRange.min && 
                         result.score <= expected.scoreRange.max;
    const hasIssues = result.issues && result.issues.length > 0;
    const meetsMinIssues = !expected.shouldDetectIssues || 
                          (hasIssues && result.issues.length >= expected.minIssuesExpected);
    
    const passed = scoreInRange && meetsMinIssues;
    
    if (passed) {
      validation.passed++;
    } else {
      validation.failed++;
    }
    
    validation.details.push({
      website: result.name,
      difficulty: result.difficulty,
      status: passed ? 'passed' : 'failed',
      score: result.score,
      expectedRange: `${expected.scoreRange.min}-${expected.scoreRange.max}`,
      scoreInRange,
      issuesFound: result.issues?.length || 0,
      minIssuesExpected: expected.minIssuesExpected,
      meetsMinIssues,
      issues: result.issues
    });
  }
  
  return validation;
}

/**
 * Run progressive difficulty tests
 */
async function runProgressiveTests() {
  console.log('🚀 Progressive Challenging Website Tests\n');
  console.log('Testing system on progressively harder websites...\n');
  
  const difficultyLevels = ['medium', 'hard', 'very-hard', 'extreme', 'expert'];
  const allResults = [];
  
  for (const level of difficultyLevels) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Testing ${level.toUpperCase()} Difficulty\n`);
    
    const websites = getWebsitesByDifficulty(level);
    console.log(`Found ${websites.length} websites at ${level} difficulty`);
    
    try {
      const results = await evaluateChallengingWebsites({
        maxDifficulty: level,
        limit: websites.length
      });
      
      allResults.push(...results);
      
      // Validate results for this level
      const validation = validateResults(results);
      console.log(`\n📈 ${level} Difficulty Results:`);
      console.log(`   ✅ Passed: ${validation.passed}`);
      console.log(`   ❌ Failed: ${validation.failed}`);
      
      // Show details
      validation.details.forEach(detail => {
        const icon = detail.status === 'passed' ? '✅' : '❌';
        console.log(`   ${icon} ${detail.website}: Score ${detail.score} (expected ${detail.expectedRange}), Issues: ${detail.issuesFound}`);
      });
      
    } catch (error) {
      console.error(`❌ Error testing ${level} difficulty: ${error.message}`);
    }
  }
  
  // Overall validation
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Overall Results\n');
  
  const overallValidation = validateResults(allResults);
  console.log(`Total Websites: ${overallValidation.total}`);
  console.log(`✅ Passed: ${overallValidation.passed}`);
  console.log(`❌ Failed: ${overallValidation.failed}`);
  console.log(`📈 Success Rate: ${((overallValidation.passed / overallValidation.total) * 100).toFixed(1)}%`);
  
  // Save validation report
  const reportPath = join(RESULTS_DIR, `challenging-validation-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    validation: overallValidation,
    results: allResults
  }, null, 2));
  
  console.log(`\n📁 Validation report saved to: ${reportPath}`);
  
  return { validation: overallValidation, results: allResults };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProgressiveTests().catch(console.error);
}

export { runProgressiveTests, validateResults };

