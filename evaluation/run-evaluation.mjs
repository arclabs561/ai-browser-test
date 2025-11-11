#!/usr/bin/env node
/**
 * Real-World Evaluation Script
 * 
 * Evaluates ai-browser-test against real websites with known characteristics.
 * Compares VLLM judgments against ground truth annotations.
 */

import { validateScreenshot, createConfig } from '../src/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Evaluation dataset with ground truth
const EVALUATION_DATASET = [
  {
    name: 'GitHub Homepage',
    url: 'https://github.com',
    description: 'Generally good accessibility, clear design',
    expectedScore: { min: 7, max: 10 },
    expectedIssues: [],
    knownGood: ['high contrast', 'clear navigation', 'accessible'],
    knownBad: []
  },
  {
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    description: 'Excellent accessibility, well-documented',
    expectedScore: { min: 8, max: 10 },
    expectedIssues: [],
    knownGood: ['WCAG compliant', 'excellent contrast', 'keyboard accessible'],
    knownBad: []
  },
  {
    name: 'W3C Homepage',
    url: 'https://www.w3.org',
    description: 'WCAG compliant, reference implementation',
    expectedScore: { min: 8, max: 10 },
    expectedIssues: [],
    knownGood: ['WCAG AAA', 'perfect accessibility'],
    knownBad: []
  }
];

// Test cases with known issues (you can add more)
const KNOWN_ISSUE_CASES = [
  {
    name: 'Low Contrast Example',
    url: 'https://example.com', // Replace with actual low-contrast site
    description: 'Known low contrast issues',
    expectedScore: { min: 0, max: 5 },
    expectedIssues: ['contrast', 'readability'],
    knownGood: [],
    knownBad: ['low contrast', 'poor readability']
  }
];

const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results');
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Capture screenshot using Playwright
 */
async function captureScreenshot(url, outputPath) {
  try {
    // Check if Playwright is available
    const playwrightAvailable = existsSync(join(process.cwd(), 'node_modules', '@playwright', 'test'));
    
    if (!playwrightAvailable) {
      console.warn('⚠️  Playwright not installed. Skipping screenshot capture.');
      console.warn('   Install with: npm install @playwright/test');
      return null;
    }
    
    // Use Playwright to capture screenshot
    const script = `
      import { chromium } from 'playwright';
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto('${url}');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '${outputPath}', fullPage: true });
      await browser.close();
    `;
    
    execSync(`node -e "${script.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
    return outputPath;
  } catch (error) {
    console.error(`Failed to capture screenshot: ${error.message}`);
    return null;
  }
}

/**
 * Evaluate a single test case
 */
async function evaluateCase(testCase, index) {
  console.log(`\n[${index + 1}/${EVALUATION_DATASET.length}] Evaluating: ${testCase.name}`);
  console.log(`   URL: ${testCase.url}`);
  console.log(`   Description: ${testCase.description}`);
  
  // Capture screenshot
  const screenshotPath = join(RESULTS_DIR, `${testCase.name.replace(/\s+/g, '-')}-${Date.now()}.png`);
  const captured = await captureScreenshot(testCase.url, screenshotPath);
  
  if (!captured) {
    return {
      testCase: testCase.name,
      success: false,
      error: 'Failed to capture screenshot'
    };
  }
  
  // Validate with VLLM
  const prompt = `Evaluate this webpage for quality, accessibility, and design. 
Check for:
- Visual design and aesthetics
- Functional correctness
- Usability and clarity
- Accessibility compliance (WCAG)
- Color contrast
- Keyboard navigation
- Screen reader compatibility

Provide a score from 0-10 and list any issues found.`;
  
  const result = await validateScreenshot(
    screenshotPath,
    prompt,
    {
      testType: 'evaluation',
      viewport: { width: 1280, height: 720 }
    }
  );
  
  // Compare against ground truth
  const evaluation = {
    testCase: testCase.name,
    url: testCase.url,
    success: true,
    result: {
      score: result.score,
      issues: result.issues,
      assessment: result.assessment,
      reasoning: result.reasoning
    },
    groundTruth: {
      expectedScore: testCase.expectedScore,
      expectedIssues: testCase.expectedIssues,
      knownGood: testCase.knownGood,
      knownBad: testCase.knownBad
    },
    comparison: {
      scoreInRange: result.score !== null && 
        result.score >= testCase.expectedScore.min && 
        result.score <= testCase.expectedScore.max,
      issuesMatch: testCase.expectedIssues.length === 0 || 
        result.issues.some(issue => 
          testCase.expectedIssues.some(expected => 
            issue.toLowerCase().includes(expected.toLowerCase())
          )
        ),
      detectedKnownGood: testCase.knownGood.some(good =>
        result.assessment?.toLowerCase().includes(good.toLowerCase()) ||
        result.reasoning?.toLowerCase().includes(good.toLowerCase())
      ),
      detectedKnownBad: testCase.knownBad.length === 0 || 
        testCase.knownBad.some(bad =>
          result.issues.some(issue => issue.toLowerCase().includes(bad.toLowerCase()))
        )
    },
    metadata: {
      provider: result.provider,
      cached: result.cached,
      responseTime: result.responseTime,
      estimatedCost: result.estimatedCost
    }
  };
  
  // Print results
  console.log(`   ✅ Score: ${result.score !== null ? result.score.toFixed(2) : 'N/A'}/10`);
  console.log(`   📋 Issues: ${result.issues.length}`);
  if (result.issues.length > 0) {
    result.issues.slice(0, 3).forEach(issue => {
      console.log(`      - ${issue}`);
    });
  }
  console.log(`   🎯 Score in expected range: ${evaluation.comparison.scoreInRange ? '✅' : '❌'}`);
  console.log(`   🔍 Issues match expected: ${evaluation.comparison.issuesMatch ? '✅' : '❌'}`);
  
  return evaluation;
}

/**
 * Main evaluation function
 */
async function runEvaluation() {
  console.log('🚀 Starting Real-World Evaluation');
  console.log(`📊 Dataset: ${EVALUATION_DATASET.length} test cases`);
  console.log(`📁 Results directory: ${RESULTS_DIR}`);
  
  // Check configuration
  const config = createConfig();
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled. Set GEMINI_API_KEY or OPENAI_API_KEY');
    process.exit(1);
  }
  
  console.log(`✅ Using provider: ${config.provider}`);
  
  // Run evaluations
  const results = [];
  for (let i = 0; i < EVALUATION_DATASET.length; i++) {
    try {
      const evaluation = await evaluateCase(EVALUATION_DATASET[i], i);
      results.push(evaluation);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error evaluating ${EVALUATION_DATASET[i].name}:`, error.message);
      results.push({
        testCase: EVALUATION_DATASET[i].name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Calculate metrics
  const successful = results.filter(r => r.success);
  const scoreAccuracy = successful.filter(r => r.comparison?.scoreInRange).length / successful.length;
  const issuesAccuracy = successful.filter(r => r.comparison?.issuesMatch).length / successful.length;
  
  // Save results
  const resultsFile = join(RESULTS_DIR, `evaluation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    dataset: EVALUATION_DATASET,
    results,
    metrics: {
      total: results.length,
      successful: successful.length,
      scoreAccuracy: (scoreAccuracy * 100).toFixed(2) + '%',
      issuesAccuracy: (issuesAccuracy * 100).toFixed(2) + '%',
      averageScore: successful.length > 0
        ? (successful.reduce((sum, r) => sum + (r.result?.score || 0), 0) / successful.length).toFixed(2)
        : 'N/A'
    }
  }, null, 2));
  
  // Print summary
  console.log('\n📊 Evaluation Summary');
  console.log(`   Total cases: ${results.length}`);
  console.log(`   Successful: ${successful.length}`);
  console.log(`   Score accuracy: ${(scoreAccuracy * 100).toFixed(2)}%`);
  console.log(`   Issues accuracy: ${(issuesAccuracy * 100).toFixed(2)}%`);
  console.log(`   Results saved to: ${resultsFile}`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEvaluation().catch(console.error);
}

export { runEvaluation, evaluateCase, EVALUATION_DATASET };

