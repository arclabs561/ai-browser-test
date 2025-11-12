#!/usr/bin/env node
/**
 * Meta Documentation Test
 * 
 * Uses ai-visual-test to test and document itself.
 * "Drink champagne / dog food" - use our own tool on itself.
 * 
 * This script:
 * 1. Captures screenshots of the documentation site
 * 2. Validates them using ai-visual-test
 * 3. Generates a report showing how well the docs score
 * 4. Creates a meta-documentation page with live results
 */

import { chromium } from 'playwright';
import { validateScreenshot, testBrowserExperience } from '../../src/index.mjs';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DOCS_SITE_URL = 'http://localhost:3000/docs-site/index.html'; // Or deployed URL
const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results', 'meta-docs');
const SCREENSHOTS_DIR = join(process.cwd(), 'evaluation', 'screenshots', 'meta-docs');

// Ensure directories exist
[RESULTS_DIR, SCREENSHOTS_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

/**
 * Test the documentation site itself
 */
async function testDocumentationSite() {
  console.log('🍾 Meta Test: Using ai-visual-test on itself\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    url: DOCS_SITE_URL,
    tests: []
  };

  try {
    // Navigate to docs site
    console.log(`📄 Loading: ${DOCS_SITE_URL}`);
    await page.goto(DOCS_SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Let page render

    // Test 1: Overall documentation quality
    console.log('\n📊 Test 1: Overall Documentation Quality');
    const screenshot1 = join(SCREENSHOTS_DIR, 'docs-overall.png');
    await page.screenshot({ path: screenshot1, fullPage: true });
    
    const validation1 = await validateScreenshot(
      screenshot1,
      'Evaluate this documentation page for clarity, accessibility, design quality, and user experience. Consider: readability, visual hierarchy, code examples, navigation, and overall usability.',
      {
        testType: 'meta-documentation',
        viewport: { width: 1280, height: 720 }
      }
    );

    results.tests.push({
      name: 'Overall Documentation Quality',
      screenshot: screenshot1,
      validation: {
        score: validation1.score,
        issues: validation1.issues,
        reasoning: validation1.reasoning,
        uncertainty: validation1.uncertainty,
        confidence: validation1.confidence
      }
    });

    console.log(`   Score: ${validation1.score}/10`);
    console.log(`   Issues: ${validation1.issues?.length || 0}`);
    console.log(`   Confidence: ${validation1.confidence?.toFixed(2) || 'N/A'}`);

    // Test 2: API Documentation Section
    console.log('\n📚 Test 2: API Documentation Section');
    await page.evaluate(() => {
      document.querySelector('.api-section')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    
    const screenshot2 = join(SCREENSHOTS_DIR, 'docs-api-section.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    
    const validation2 = await validateScreenshot(
      screenshot2,
      'Evaluate this API documentation section. Check: code examples are clear, syntax highlighting works, explanations are helpful, visual design supports readability.',
      {
        testType: 'meta-documentation',
        viewport: { width: 1280, height: 720 }
      }
    );

    results.tests.push({
      name: 'API Documentation Section',
      screenshot: screenshot2,
      validation: {
        score: validation2.score,
        issues: validation2.issues,
        reasoning: validation2.reasoning,
        uncertainty: validation2.uncertainty,
        confidence: validation2.confidence
      }
    });

    console.log(`   Score: ${validation2.score}/10`);
    console.log(`   Issues: ${validation2.issues?.length || 0}`);

    // Test 3: Meta Test Section (recursive!)
    console.log('\n🔄 Test 3: Meta Test Section (Recursive Validation)');
    await page.evaluate(() => {
      document.querySelector('.meta-test')?.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);
    
    const screenshot3 = join(SCREENSHOTS_DIR, 'docs-meta-test.png');
    await page.screenshot({ path: screenshot3, fullPage: false });
    
    const validation3 = await validateScreenshot(
      screenshot3,
      'Evaluate this meta-test section that shows ai-visual-test testing itself. Check: Does it clearly demonstrate the tool? Is the concept well-explained?',
      {
        testType: 'meta-documentation',
        viewport: { width: 1280, height: 720 }
      }
    );

    results.tests.push({
      name: 'Meta Test Section',
      screenshot: screenshot3,
      validation: {
        score: validation3.score,
        issues: validation3.issues,
        reasoning: validation3.reasoning,
        uncertainty: validation3.uncertainty,
        confidence: validation3.confidence
      }
    });

    console.log(`   Score: ${validation3.score}/10`);
    console.log(`   Issues: ${validation3.issues?.length || 0}`);

    // Test 4: Full Browser Experience
    console.log('\n🌐 Test 4: Full Browser Experience');
    const experience = await testBrowserExperience(page, {
      url: DOCS_SITE_URL,
      stages: ['initial', 'scroll', 'interaction'],
      goals: ['accessibility', 'usability', 'design']
    });

    results.tests.push({
      name: 'Full Browser Experience',
      experience: experience
    });

    console.log(`   Stages tested: ${experience.stages?.length || 0}`);
    console.log(`   Average score: ${experience.averageScore?.toFixed(2) || 'N/A'}`);

    // Calculate summary
    const scores = results.tests
      .filter(t => t.validation?.score !== null && t.validation?.score !== undefined)
      .map(t => t.validation.score);
    
    results.summary = {
      totalTests: results.tests.length,
      averageScore: scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : null,
      minScore: scores.length > 0 ? Math.min(...scores) : null,
      maxScore: scores.length > 0 ? Math.max(...scores) : null,
      totalIssues: results.tests.reduce((sum, t) => sum + (t.validation?.issues?.length || 0), 0)
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 Meta Test Summary');
    console.log('='.repeat(60));
    console.log(`Average Score: ${results.summary.averageScore?.toFixed(2) || 'N/A'}/10`);
    console.log(`Total Issues: ${results.summary.totalIssues}`);
    console.log(`Tests Run: ${results.summary.totalTests}`);

  } catch (error) {
    console.error('❌ Error during meta test:', error);
    results.error = error.message;
  } finally {
    await browser.close();
  }

  // Save results
  const timestamp = Date.now();
  const resultsFile = join(RESULTS_DIR, `meta-test-${timestamp}.json`);
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  // Generate HTML report
  generateHTMLReport(results, timestamp);

  return results;
}

/**
 * Generate HTML report with live results
 */
function generateHTMLReport(results, timestamp) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meta Documentation Test Results</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .summary {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-result {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .score {
      font-size: 2rem;
      font-weight: bold;
      color: #10b981;
    }
    .issues {
      margin-top: 1rem;
      padding: 1rem;
      background: #fef3c7;
      border-radius: 4px;
    }
    .issue {
      margin: 0.5rem 0;
      padding: 0.5rem;
      background: white;
      border-left: 3px solid #f59e0b;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍾 Meta Documentation Test Results</h1>
    <p>ai-visual-test testing itself - "Drink champagne / dog food"</p>
    <p><small>Generated: ${new Date(results.timestamp).toLocaleString()}</small></p>
  </div>

  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Average Score:</strong> <span class="score">${results.summary?.averageScore?.toFixed(2) || 'N/A'}</span>/10</p>
    <p><strong>Total Issues:</strong> ${results.summary?.totalIssues || 0}</p>
    <p><strong>Tests Run:</strong> ${results.summary?.totalTests || 0}</p>
    <p><strong>Score Range:</strong> ${results.summary?.minScore || 'N/A'} - ${results.summary?.maxScore || 'N/A'}</p>
  </div>

  ${results.tests.map((test, i) => `
    <div class="test-result">
      <h3>Test ${i + 1}: ${test.name}</h3>
      ${test.validation ? `
        <p><strong>Score:</strong> <span class="score">${test.validation.score}</span>/10</p>
        <p><strong>Confidence:</strong> ${test.validation.confidence?.toFixed(2) || 'N/A'}</p>
        <p><strong>Uncertainty:</strong> ${test.validation.uncertainty?.toFixed(2) || 'N/A'}</p>
        ${test.validation.reasoning ? `<p><strong>Reasoning:</strong> ${test.validation.reasoning}</p>` : ''}
        ${test.validation.issues && test.validation.issues.length > 0 ? `
          <div class="issues">
            <strong>Issues (${test.validation.issues.length}):</strong>
            ${test.validation.issues.map(issue => `
              <div class="issue">
                <strong>${issue.type || 'Issue'}:</strong> ${issue.description || issue}
              </div>
            `).join('')}
          </div>
        ` : ''}
      ` : ''}
      ${test.screenshot ? `<p><small>Screenshot: ${test.screenshot}</small></p>` : ''}
    </div>
  `).join('')}
</body>
</html>`;

  const reportFile = join(RESULTS_DIR, `meta-test-report-${timestamp}.html`);
  writeFileSync(reportFile, html);
  console.log(`📄 HTML report: ${reportFile}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDocumentationSite()
    .then(() => {
      console.log('\n✅ Meta test complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Meta test failed:', error);
      process.exit(1);
    });
}

export { testDocumentationSite };

