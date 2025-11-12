/**
 * Test Real-World Websites
 * 
 * Tests ai-visual-test against diverse real websites to evaluate
 * how well it handles different UI patterns, complexity levels, and use cases.
 */

import { validateScreenshot, createConfig } from '../../src/index.mjs';
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const TEST_SITES = [
  {
    name: 'Stripe',
    url: 'https://stripe.com',
    description: 'Payment UI - clean, professional design',
    testPrompts: [
      'Evaluate this page\'s call-to-action. Analyze clarity, visibility, and effectiveness. Provide detailed reasoning and a score from 1-10.',
      'Evaluate the navigation menu. Analyze visibility, accessibility, and usability. Provide detailed reasoning and a score from 1-10.',
      'Evaluate for visual errors or broken elements. Analyze layout, rendering, and visual consistency. Provide detailed reasoning and a score from 1-10.'
    ]
  },
  {
    name: 'Linear',
    url: 'https://linear.app',
    description: 'Modern SaaS - complex state management',
    testPrompts: [
      'Evaluate the page layout. Analyze organization, spacing, visual hierarchy, and clarity. Provide detailed reasoning and a score from 1-10.',
      'Evaluate interactive elements. Analyze visibility, clarity, and accessibility. Provide detailed reasoning and a score from 1-10.',
      'Evaluate the design against modern UI principles. Analyze typography, spacing, contrast, and usability patterns. Provide detailed reasoning and a score from 1-10.'
    ]
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com',
    description: 'Developer tools - design system showcase',
    testPrompts: [
      'Evaluate the hero section. Analyze visual appeal, clarity, and effectiveness. Provide detailed reasoning and a score from 1-10.',
      'Evaluate code examples or demos. Analyze clarity, visibility, and usefulness. Provide detailed reasoning and a score from 1-10.',
      'Evaluate navigation intuitiveness. Analyze clarity, discoverability, and usability. Provide detailed reasoning and a score from 1-10.'
    ]
  },
  {
    name: 'GitHub',
    url: 'https://github.com',
    description: 'Code interface - complex, information-dense',
    testPrompts: [
      'Evaluate content visibility. Analyze whether repository lists or main content are clearly visible and accessible. Provide detailed reasoning and a score from 1-10.',
      'Evaluate the navigation bar. Analyze presence, functionality, and usability. Provide detailed reasoning and a score from 1-10.',
      'Evaluate for layout issues. Analyze overlapping elements, spacing problems, and visual consistency. Provide detailed reasoning and a score from 1-10.'
    ]
  },
  {
    name: 'Notion',
    url: 'https://notion.so',
    description: 'Rich content - WYSIWYG editor',
    testPrompts: [
      'Evaluate content readability. Analyze typography, formatting, spacing, and clarity. Provide detailed reasoning and a score from 1-10.',
      'Evaluate editing tools and interface elements. Analyze visibility, clarity, and usability. Provide detailed reasoning and a score from 1-10.',
      'Evaluate layout organization. Analyze structure, spacing, visual hierarchy, and clarity. Provide detailed reasoning and a score from 1-10.'
    ]
  },
  {
    name: 'Shopify',
    url: 'https://shopify.com',
    description: 'E-commerce - product showcase',
    testPrompts: [
      'Evaluate product/service presentation. Analyze clarity, visibility, and effectiveness of communication. Provide detailed reasoning and a score from 1-10.',
      'Evaluate pricing and CTA visibility. Analyze clarity, prominence, and effectiveness. Provide detailed reasoning and a score from 1-10.',
      'Evaluate design professionalism. Analyze trustworthiness, quality, and visual appeal. Provide detailed reasoning and a score from 1-10.'
    ]
  },
  {
    name: 'Medium',
    url: 'https://medium.com',
    description: 'Content platform - article layout',
    testPrompts: [
      'Evaluate article content readability. Analyze typography, spacing, contrast, and clarity. Provide detailed reasoning and a score from 1-10.',
      'Evaluate typography quality. Analyze clarity, spacing, hierarchy, and readability. Provide detailed reasoning and a score from 1-10.',
      'Evaluate navigation elements. Analyze presence, visibility, and accessibility. Provide detailed reasoning and a score from 1-10.'
    ]
  },
  {
    name: 'CodePen',
    url: 'https://codepen.io',
    description: 'Interactive - code playground',
    testPrompts: [
      'Evaluate code editor interface visibility. Analyze whether the editor is visible, accessible, and functional. Provide detailed reasoning and a score from 1-10.',
      'Evaluate for visual glitches or errors. Analyze rendering issues, layout problems, and visual consistency. Provide detailed reasoning and a score from 1-10.',
      'Evaluate layout functionality for coding. Analyze whether the layout supports coding workflows effectively. Provide detailed reasoning and a score from 1-10.'
    ]
  }
];

const config = createConfig();
const results = [];

async function testSite(site, retries = 2) {
  console.log(`\n📸 Testing ${site.name} (${site.url})...`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate and wait for load (use domcontentloaded for faster, more reliable loading)
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // Additional wait for dynamic content
    
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Take screenshot
    const screenshotPath = `test-results/${site.name.toLowerCase()}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Test each prompt
    const siteResults = {
      site: site.name,
      url: site.url,
      description: site.description,
      tests: []
    };
    
    for (const prompt of site.testPrompts) {
      let testRetries = 1;
      let success = false;
      
      while (testRetries >= 0 && !success) {
        try {
          console.log(`  ✓ Testing: "${prompt.substring(0, 50)}..."`);
          
          const result = await validateScreenshot(
            screenshotPath,
            prompt,
            {
              testType: `real-site-${site.name.toLowerCase()}`,
              useCache: true,
              timeout: 45000 // Longer timeout for reliability
            }
          );
        
          siteResults.tests.push({
            prompt,
            score: result.score,
            assessment: result.assessment,
            issues: result.issues,
            reasoning: result.reasoning?.substring(0, 200), // Truncate for readability
            enabled: result.enabled
          });
          
          // Better output formatting
          const scoreStr = result.score !== null && result.score !== undefined ? `${result.score}/10` : 'N/A';
          // Infer assessment from score if not provided
          let assessmentStr = result.assessment;
          if (!assessmentStr && result.score !== null && result.score !== undefined) {
            assessmentStr = result.score >= 7 ? 'pass' : result.score < 5 ? 'fail' : 'needs-improvement';
          } else if (!assessmentStr) {
            assessmentStr = 'N/A';
          }
          const enabledStr = result.enabled === false ? ' (disabled)' : '';
          const statusStr = result.enabled === false ? '⚠️  API disabled' : 
                           result.score === null ? 'ℹ️  No score' : '✅';
          console.log(`    ${statusStr} Score: ${scoreStr}, Assessment: ${assessmentStr}${enabledStr}`);
          
          // Show concise summary - prioritize reasoning quality
          const reasoningLength = result.reasoning ? result.reasoning.length : 0;
          if (reasoningLength < 20) {
            console.log(`    ⚠️  Minimal reasoning (${reasoningLength} chars) - may need better prompt`);
          }
          
          if (result.score === null && result.reasoning) {
            // For no-score results, show first sentence of reasoning
            const firstSentence = result.reasoning.split('.')[0].substring(0, 100);
            console.log(`    → ${firstSentence}...`);
          } else if (result.issues && result.issues.length > 0) {
            // Filter out long reasoning text, keep only actual issues
            const actualIssues = result.issues.filter(issue => 
              issue.length < 80 && 
              !issue.includes('**') && 
              !issue.startsWith('Yes,') &&
              !issue.startsWith('Based on') &&
              !issue.includes('###')
            );
            if (actualIssues.length > 0) {
              const issuesStr = actualIssues.slice(0, 2).map(i => i.trim()).join('; ');
              console.log(`    → ${issuesStr}${actualIssues.length > 2 ? '...' : ''}`);
            }
          }
          
          // Success - break out of retry loop
          success = true;
        } catch (error) {
          // Retry on timeout or transient errors
          if (testRetries > 0 && (error.message.includes('timeout') || error.message.includes('ECONNRESET'))) {
            console.log(`    ⏳ Retrying... (${testRetries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            testRetries--;
            continue;
          }
          
          // No more retries or non-retryable error
          console.error(`    ✗ Error: ${error.message}`);
          siteResults.tests.push({
            prompt,
            error: error.message,
            retried: testRetries < 1
          });
          break;
        }
      }
    }
    
    results.push(siteResults);
    await browser.close();
    
  } catch (error) {
    console.error(`  ✗ Failed to test ${site.name}: ${error.message}`);
    results.push({
      site: site.name,
      url: site.url,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    await browser.close();
  }
}

async function runTests() {
  console.log('🚀 Starting real-world website tests...\n');
  console.log(`Testing ${TEST_SITES.length} sites with ai-visual-test\n`);
  
  for (const site of TEST_SITES) {
    await testSite(site);
    // Small delay between sites
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save results
  const resultsPath = `test-results/real-sites-test-${Date.now()}.json`;
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(`\n✅ Tests complete! Results saved to: ${resultsPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Sites tested: ${results.length}`);
  console.log(`   Successful: ${results.filter(r => !r.error).length}`);
  console.log(`   Failed: ${results.filter(r => r.error).length}`);
  
  // Show score statistics
  const allTests = results.flatMap(r => r.tests || []);
  const testsWithScores = allTests.filter(t => t.score !== null && t.score !== undefined);
  const testsDisabled = allTests.filter(t => t.enabled === false);
  
  if (testsWithScores.length > 0) {
    const avgScore = testsWithScores.reduce((sum, t) => sum + t.score, 0) / testsWithScores.length;
    const minScore = Math.min(...testsWithScores.map(t => t.score));
    const maxScore = Math.max(...testsWithScores.map(t => t.score));
    console.log(`\n📈 Score Statistics:`);
    console.log(`   Tests with scores: ${testsWithScores.length}/${allTests.length}`);
    console.log(`   Average score: ${avgScore.toFixed(1)}/10`);
    console.log(`   Score range: ${minScore}-${maxScore}/10`);
  }
  
  if (testsDisabled.length > 0) {
    console.log(`   ⚠️  Disabled tests: ${testsDisabled.length} (API key not set)`);
  }
  
  // Show quality metrics
  const previousRun = testsWithScores.length / allTests.length;
  const avgReasoningLength = allTests
    .filter(t => t.reasoning)
    .reduce((sum, t) => sum + (t.reasoning?.length || 0), 0) / 
    Math.max(1, allTests.filter(t => t.reasoning).length);
  const testsWithGoodReasoning = allTests.filter(t => t.reasoning && t.reasoning.length > 50).length;
  
  console.log(`\n📈 Quality Metrics:`);
  console.log(`   Score Extraction: ${(previousRun * 100).toFixed(1)}% (${testsWithScores.length}/${allTests.length})`);
  console.log(`   Avg Reasoning Length: ${avgReasoningLength.toFixed(0)} chars`);
  console.log(`   Tests with Detailed Reasoning (>50 chars): ${testsWithGoodReasoning}/${allTests.length} (${(testsWithGoodReasoning/allTests.length*100).toFixed(1)}%)`);
  
  if (avgReasoningLength < 50) {
    console.log(`   ⚠️  WARNING: Reasoning quality is low - prompts may need improvement`);
  }
  
  // Show site performance summary
  const siteStats = results
    .filter(r => !r.error && r.tests)
    .map(r => {
      const testsWithScores = r.tests.filter(t => t.score !== null && t.score !== undefined);
      const testsWithReasoning = r.tests.filter(t => t.reasoning || (t.issues && t.issues.length > 0));
      return {
        name: r.site,
        url: r.url,
        totalTests: r.tests.length,
        testsWithScores: testsWithScores.length,
        testsWithReasoning: testsWithReasoning.length,
        avgScore: testsWithScores.length > 0 
          ? testsWithScores.reduce((sum, t) => sum + t.score, 0) / testsWithScores.length 
          : null,
        successRate: (testsWithScores.length / r.tests.length) * 100
      };
    })
    .sort((a, b) => {
      // Sort by: tests with scores first, then by avg score
      if (a.testsWithScores > 0 && b.testsWithScores === 0) return -1;
      if (a.testsWithScores === 0 && b.testsWithScores > 0) return 1;
      if (a.avgScore !== null && b.avgScore !== null) return b.avgScore - a.avgScore;
      return b.testsWithReasoning - a.testsWithReasoning;
    });
  
  if (siteStats.length > 0) {
    console.log(`\n📊 Site Performance:`);
    siteStats.forEach((s, i) => {
      const scoreStr = s.avgScore !== null ? `${s.avgScore.toFixed(1)}/10` : 'N/A';
      const scoreRate = `${s.testsWithScores}/${s.totalTests} tests scored`;
      console.log(`   ${i + 1}. ${s.name}: ${scoreStr} (${scoreRate})`);
    });
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { TEST_SITES, testSite, runTests };

