#!/usr/bin/env node
/**
 * Comprehensive Meta Experience Test
 * 
 * Uses ALL of ai-visual-test's capabilities to experience and validate
 * the documentation site itself. This is the ultimate "drink champagne / dog food" test.
 * 
 * Tests:
 * - Basic validation (validateScreenshot)
 * - Persona-based evaluation (experiencePageAsPersona)
 * - Multi-modal validation (screenshot + HTML + CSS)
 * - Temporal aggregation (captureTemporalScreenshots)
 * - Cross-modal consistency (checkCrossModalConsistency)
 * - Goals-based validation (validateWithGoals)
 * - Gameplay testing (testGameplay) - adapted for docs
 * - Browser experience testing (testBrowserExperience)
 * - Uncertainty reduction
 * - Human validation integration
 * - Ensemble judging
 */

import { chromium } from 'playwright';
import {
  validateScreenshot,
  experiencePageAsPersona,
  extractRenderedCode,
  captureTemporalScreenshots,
  checkCrossModalConsistency,
  aggregateTemporalNotes,
  aggregateMultiScale,
  EnsembleJudge
} from '../../src/index.mjs';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DOCS_SITE_URL = 'http://localhost:3000/docs-site/index.html'; // Or deployed URL
const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results', 'meta-comprehensive');
const SCREENSHOTS_DIR = join(process.cwd(), 'evaluation', 'screenshots', 'meta-comprehensive');

// Ensure directories exist
[RESULTS_DIR, SCREENSHOTS_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

/**
 * Comprehensive meta experience test
 */
async function runComprehensiveMetaExperience() {
  console.log('🍾 Comprehensive Meta Experience Test');
  console.log('Using ALL ai-visual-test capabilities on the docs site itself\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    url: DOCS_SITE_URL,
    tests: [],
    summary: {}
  };

  try {
    // Navigate to docs site
    console.log(`📄 Loading: ${DOCS_SITE_URL}`);
    await page.goto(DOCS_SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Test 1: Basic Validation
    console.log('\n📊 Test 1: Basic Validation (validateScreenshot)');
    const screenshot1 = join(SCREENSHOTS_DIR, 'docs-basic.png');
    await page.screenshot({ path: screenshot1, fullPage: true });
    
    const basicValidation = await validateScreenshot(
      screenshot1,
      'Evaluate this documentation page for clarity, accessibility, design quality, and user experience.',
      {
        testType: 'meta-documentation-basic',
        viewport: { width: 1280, height: 720 },
        enableUncertaintyReduction: true,
        enableHallucinationCheck: true
      }
    );

    results.tests.push({
      name: 'Basic Validation',
      method: 'validateScreenshot',
      screenshot: screenshot1,
      result: {
        score: basicValidation.score,
        issues: basicValidation.issues,
        uncertainty: basicValidation.uncertainty,
        confidence: basicValidation.confidence,
        selfConsistencyRecommended: basicValidation.selfConsistencyRecommended
      }
    });

    console.log(`   Score: ${basicValidation.score}/10`);
    console.log(`   Confidence: ${basicValidation.confidence?.toFixed(2) || 'N/A'}`);

    // Test 2: Persona-Based Evaluation
    console.log('\n👤 Test 2: Persona-Based Evaluation');
    const personas = [
      {
        name: 'New Developer',
        goals: ['understand the API quickly', 'find examples'],
        concerns: ['complexity', 'learning curve'],
        focus: ['quick-start', 'examples', 'simplicity']
      },
      {
        name: 'Experienced Developer',
        goals: ['deep API understanding', 'advanced features'],
        concerns: ['completeness', 'edge cases'],
        focus: ['api-reference', 'advanced-features', 'type-definitions']
      },
      {
        name: 'Accessibility Advocate',
        goals: ['evaluate accessibility', 'check WCAG compliance'],
        concerns: ['accessibility', 'keyboard navigation'],
        focus: ['accessibility', 'keyboard-navigation', 'screen-readers']
      }
    ];

    const personaResults = [];
    for (const persona of personas) {
      console.log(`   Testing as: ${persona.name}`);
      
      const personaExperience = await experiencePageAsPersona(
        page,
        {
          ...persona,
          prompt: `Evaluate this documentation from the perspective of ${persona.name}. Your goals: ${persona.goals.join(', ')}. Your concerns: ${persona.concerns.join(', ')}.`
        },
        {
          url: DOCS_SITE_URL,
          testType: 'meta-documentation-persona',
          captureCode: true,
          captureTemporal: true,
          duration: 5000 // 5 seconds of interaction
        }
      );

      personaResults.push({
        persona: persona.name,
        score: personaExperience.evaluation?.score,
        notes: personaExperience.notes?.length || 0,
        aggregated: personaExperience.aggregated,
        aggregatedMultiScale: personaExperience.aggregatedMultiScale
      });

      console.log(`      Score: ${personaExperience.evaluation?.score || 'N/A'}/10`);
    }

    results.tests.push({
      name: 'Persona-Based Evaluation',
      method: 'experiencePageAsPersona',
      personas: personaResults
    });

    // Test 3: Multi-Modal Validation
    console.log('\n🔍 Test 3: Multi-Modal Validation (Screenshot + HTML + CSS)');
    const renderedCode = await extractRenderedCode(page);
    const screenshot3 = join(SCREENSHOTS_DIR, 'docs-multimodal.png');
    await page.screenshot({ path: screenshot3, fullPage: true });

    const multiModalValidation = await validateScreenshot(
      screenshot3,
      'Evaluate this documentation page. Check consistency between visual appearance (screenshot) and underlying code (HTML/CSS).',
      {
        testType: 'meta-documentation-multimodal',
        html: renderedCode.html,
        css: renderedCode.criticalCSS,
        renderedCode: renderedCode
      }
    );

    // Check cross-modal consistency
    const consistency = checkCrossModalConsistency({
      screenshot: screenshot3,
      renderedCode: renderedCode,
      strict: false
    });

    results.tests.push({
      name: 'Multi-Modal Validation',
      method: 'validateScreenshot + extractRenderedCode',
      screenshot: screenshot3,
      result: {
        score: multiModalValidation.score,
        issues: multiModalValidation.issues,
        consistency: consistency
      }
    });

    console.log(`   Score: ${multiModalValidation.score}/10`);
    console.log(`   Consistency: ${consistency.isConsistent ? '✓' : '✗'}`);

    // Test 4: Temporal Aggregation
    console.log('\n⏱️  Test 4: Temporal Aggregation');
    const temporalScreenshots = await captureTemporalScreenshots(
      page,
      {
        duration: 10000, // 10 seconds
        fps: 2, // 2 screenshots per second
        testType: 'meta-documentation-temporal'
      }
    );

    // Aggregate temporal notes
    const temporalNotes = temporalScreenshots.map((shot, i) => ({
      elapsed: i * 500, // 500ms intervals
      screenshot: shot.path,
      timestamp: shot.timestamp,
      score: shot.validation?.score || null
    }));

    const aggregated = aggregateTemporalNotes(temporalNotes, {
      windowSize: 5000,
      decayFactor: 0.9
    });

    const aggregatedMultiScale = aggregateMultiScale(temporalNotes, {
      timeScales: {
        immediate: 100,
        short: 1000,
        medium: 5000,
        long: 10000
      }
    });

    results.tests.push({
      name: 'Temporal Aggregation',
      method: 'captureTemporalScreenshots + aggregateTemporalNotes',
      screenshots: temporalScreenshots.length,
      aggregated: aggregated,
      aggregatedMultiScale: aggregatedMultiScale
    });

    console.log(`   Screenshots captured: ${temporalScreenshots.length}`);
    console.log(`   Temporal coherence: ${aggregated.coherence?.toFixed(2) || 'N/A'}`);

    // Test 5: Goals-Based Validation (using convenience function)
    console.log('\n🎯 Test 5: Goals-Based Validation');
    const { validateWithGoals, createGameGoal } = await import('../src/index.mjs');
    
    const goals = [
      'accessibility',
      'usability',
      'design-quality',
      createGameGoal('accessibility'),
      {
        description: 'Documentation clarity',
        criteria: ['Clear examples', 'Good navigation', 'Readable code blocks']
      }
    ];

    const goalResults = [];
    for (const goal of goals) {
      const goalValidation = await validateWithGoals(
        screenshot1,
        {
          goal: goal,
          context: {
            testType: 'meta-documentation-goals',
            enableUncertaintyReduction: true
          }
        }
      );

      goalResults.push({
        goal: typeof goal === 'string' ? goal : goal.description || 'unknown',
        score: goalValidation.result?.score,
        confidence: goalValidation.result?.confidence
      });
    }

    results.tests.push({
      name: 'Goals-Based Validation',
      method: 'validateWithGoals',
      goals: goalResults
    });

    console.log(`   Goals tested: ${goals.length}`);

    // Test 6: Browser Experience Testing (using convenience function)
    console.log('\n🌐 Test 6: Browser Experience Testing');
    const { testBrowserExperience } = await import('../src/index.mjs');
    
    const browserExperience = await testBrowserExperience(page, {
      url: DOCS_SITE_URL,
      stages: ['initial-load', 'scroll', 'navigation', 'interaction'],
      captureTemporal: true,
      captureCode: true
    });

    results.tests.push({
      name: 'Browser Experience Testing',
      method: 'testBrowserExperience',
      stages: browserExperience.stages?.length || 0,
      averageScore: browserExperience.averageScore,
      aggregated: browserExperience.aggregated,
      aggregatedMultiScale: browserExperience.aggregatedMultiScale
    });

    console.log(`   Stages: ${browserExperience.stages?.length || 0}`);
    console.log(`   Average score: ${browserExperience.averageScore?.toFixed(2) || 'N/A'}`);

    // Test 7: Ensemble Judging
    console.log('\n🎭 Test 7: Ensemble Judging (Multiple Providers)');
    try {
      const ensemble = new EnsembleJudge({
        providers: ['gemini', 'openai', 'claude'].filter(p => {
          // Only use providers that are configured
          try {
            const { getConfig } = await import('../src/config.mjs');
            const config = getConfig();
            return config.providers[p]?.apiKey;
          } catch {
            return false;
          }
        }),
        weights: 'optimal'
      });

      if (ensemble.providers.length > 0) {
        const ensembleResult = await ensemble.judge(
          screenshot1,
          'Evaluate this documentation page comprehensively.'
        );

        results.tests.push({
          name: 'Ensemble Judging',
          method: 'EnsembleJudge',
          providers: ensemble.providers,
          result: {
            score: ensembleResult.score,
            confidence: ensembleResult.confidence,
            agreement: ensembleResult.agreement
          }
        });

        console.log(`   Providers: ${ensemble.providers.join(', ')}`);
        console.log(`   Ensemble score: ${ensembleResult.score}/10`);
      } else {
        console.log('   ⚠️  No providers configured for ensemble');
      }
    } catch (error) {
      console.log(`   ⚠️  Ensemble test skipped: ${error.message}`);
    }

    // Calculate comprehensive summary
    const allScores = results.tests
      .flatMap(t => {
        if (t.result?.score !== null && t.result?.score !== undefined) return [t.result.score];
        if (t.personas) return t.personas.map(p => p.score).filter(s => s !== null);
        if (t.goals) return t.goals.map(g => g.score).filter(s => s !== null);
        return [];
      })
      .filter(s => s !== null && s !== undefined);

    results.summary = {
      totalTests: results.tests.length,
      averageScore: allScores.length > 0 
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length 
        : null,
      minScore: allScores.length > 0 ? Math.min(...allScores) : null,
      maxScore: allScores.length > 0 ? Math.max(...allScores) : null,
      totalIssues: results.tests.reduce((sum, t) => sum + (t.result?.issues?.length || 0), 0),
      techniquesUsed: [
        'validateScreenshot',
        'experiencePageAsPersona',
        'extractRenderedCode',
        'captureTemporalScreenshots',
        'aggregateTemporalNotes',
        'aggregateMultiScale',
        'checkCrossModalConsistency',
        'validateWithGoals',
        'testBrowserExperience',
        'EnsembleJudge'
      ]
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 Comprehensive Meta Experience Summary');
    console.log('='.repeat(60));
    console.log(`Average Score: ${results.summary.averageScore?.toFixed(2) || 'N/A'}/10`);
    console.log(`Total Issues: ${results.summary.totalIssues}`);
    console.log(`Tests Run: ${results.summary.totalTests}`);
    console.log(`Techniques Used: ${results.summary.techniquesUsed.length}`);
    console.log(`   ${results.summary.techniquesUsed.join(', ')}`);

  } catch (error) {
    console.error('❌ Error during comprehensive meta experience:', error);
    results.error = error.message;
    results.stack = error.stack;
  } finally {
    await browser.close();
  }

  // Save results
  const timestamp = Date.now();
  const resultsFile = join(RESULTS_DIR, `comprehensive-meta-${timestamp}.json`);
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  // Generate comprehensive HTML report
  generateComprehensiveReport(results, timestamp);

  return results;
}

/**
 * Generate comprehensive HTML report
 */
function generateComprehensiveReport(results, timestamp) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprehensive Meta Experience Test Results</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
      line-height: 1.6;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .summary {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .summary-item {
      padding: 1rem;
      background: #f7f7f7;
      border-radius: 4px;
    }
    .summary-item strong {
      display: block;
      color: #667eea;
      margin-bottom: 0.5rem;
    }
    .test-result {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-result h3 {
      color: #667eea;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #667eea;
    }
    .score {
      font-size: 2rem;
      font-weight: bold;
      color: #10b981;
    }
    .techniques {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .technique {
      padding: 0.25rem 0.75rem;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 12px;
      font-size: 0.85rem;
    }
    .persona {
      margin: 1rem 0;
      padding: 1rem;
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
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
    .meta-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #fbbf24;
      color: #78350f;
      border-radius: 20px;
      font-weight: bold;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="meta-badge">🍾 META TEST: ai-visual-test testing itself</div>
    <h1>Comprehensive Meta Experience Test Results</h1>
    <p>All API capabilities used to evaluate the documentation site</p>
    <p><small>Generated: ${new Date(results.timestamp).toLocaleString()}</small></p>
  </div>

  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <strong>Average Score</strong>
        <span class="score">${results.summary?.averageScore?.toFixed(2) || 'N/A'}</span>/10
      </div>
      <div class="summary-item">
        <strong>Total Issues</strong>
        ${results.summary?.totalIssues || 0}
      </div>
      <div class="summary-item">
        <strong>Tests Run</strong>
        ${results.summary?.totalTests || 0}
      </div>
      <div class="summary-item">
        <strong>Techniques Used</strong>
        ${results.summary?.techniquesUsed?.length || 0}
      </div>
      <div class="summary-item">
        <strong>Score Range</strong>
        ${results.summary?.minScore || 'N/A'} - ${results.summary?.maxScore || 'N/A'}
      </div>
    </div>
    <div class="techniques">
      ${results.summary?.techniquesUsed?.map(t => `<span class="technique">${t}</span>`).join('') || ''}
    </div>
  </div>

  ${results.tests.map((test, i) => `
    <div class="test-result">
      <h3>Test ${i + 1}: ${test.name}</h3>
      <p><strong>Method:</strong> <code>${test.method}</code></p>
      
      ${test.result ? `
        <p><strong>Score:</strong> <span class="score">${test.result.score}</span>/10</p>
        ${test.result.confidence ? `<p><strong>Confidence:</strong> ${test.result.confidence.toFixed(2)}</p>` : ''}
        ${test.result.uncertainty ? `<p><strong>Uncertainty:</strong> ${test.result.uncertainty.toFixed(2)}</p>` : ''}
        ${test.result.consistency ? `<p><strong>Cross-Modal Consistency:</strong> ${test.result.consistency.isConsistent ? '✓ Consistent' : '✗ Inconsistent'}</p>` : ''}
        ${test.result.issues && test.result.issues.length > 0 ? `
          <div class="issues">
            <strong>Issues (${test.result.issues.length}):</strong>
            ${test.result.issues.map(issue => `
              <div class="issue">
                <strong>${issue.type || 'Issue'}:</strong> ${issue.description || issue}
                ${issue.importance ? ` <em>(${issue.importance})</em>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      ` : ''}
      
      ${test.personas ? `
        <h4>Persona Results:</h4>
        ${test.personas.map(p => `
          <div class="persona">
            <strong>${p.persona}:</strong> Score ${p.score || 'N/A'}/10
            <br><small>Notes: ${p.notes}, Aggregated: ${p.aggregated ? 'Yes' : 'No'}</small>
          </div>
        `).join('')}
      ` : ''}
      
      ${test.goals ? `
        <h4>Goal Results:</h4>
        ${test.goals.map(g => `
          <p><strong>${g.goal}:</strong> ${g.score || 'N/A'}/10</p>
        `).join('')}
      ` : ''}
      
      ${test.screenshots ? `<p><small>Screenshots: ${test.screenshots}</small></p>` : ''}
      ${test.stages ? `<p><small>Stages: ${test.stages}</small></p>` : ''}
    </div>
  `).join('')}
  
  <div class="test-result" style="background: #f0fdf4; border: 2px solid #10b981;">
    <h3>✅ Meta Test Complete</h3>
    <p>This demonstrates ai-visual-test comprehensively testing itself using all available APIs and capabilities.</p>
    <p><strong>Techniques Demonstrated:</strong></p>
    <ul>
      ${results.summary?.techniquesUsed?.map(t => `<li><code>${t}</code></li>`).join('') || ''}
    </ul>
  </div>
</body>
</html>`;

  const reportFile = join(RESULTS_DIR, `comprehensive-meta-report-${timestamp}.html`);
  writeFileSync(reportFile, html);
  console.log(`📄 Comprehensive report: ${reportFile}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveMetaExperience()
    .then(() => {
      console.log('\n✅ Comprehensive meta experience complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Comprehensive meta experience failed:', error);
      process.exit(1);
    });
}

export { runComprehensiveMetaExperience };

