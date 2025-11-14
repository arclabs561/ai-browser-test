#!/usr/bin/env node
/**
 * Method Comparison
 * 
 * Compares ai-visual-test against other evaluation methods:
 * - Other VLLM providers
 * - Traditional accessibility tools
 * - Research implementations
 * - Human evaluators (if available)
 */

import { validateScreenshot, createConfig } from '../../src/index.mjs';
import { calculateCohensKappa } from '../utils/metrics.mjs';

/**
 * Compare results across multiple providers
 */
export async function compareProviders(screenshotPath, prompt, context = {}) {
  const providers = ['gemini', 'openai', 'claude'];
  const results = {};
  
  for (const provider of providers) {
    try {
      const config = createConfig({ provider });
      if (config.enabled) {
        console.log(`   Evaluating with ${provider}...`);
        const result = await validateScreenshot(screenshotPath, prompt, { ...context, provider });
        results[provider] = {
          score: result.score,
          issues: result.issues || [],
          assessment: result.assessment,
          reasoning: result.reasoning,
          responseTime: result.responseTime,
          cost: result.estimatedCost?.totalCost || 0
        };
      } else {
        console.log(`   ⚠️  ${provider} not available (no API key)`);
      }
    } catch (error) {
      console.error(`   ❌ Error with ${provider}:`, error.message);
      results[provider] = { error: error.message };
    }
  }
  
  // Calculate agreement
  const scores = Object.values(results)
    .filter(r => r.score !== null && r.score !== undefined)
    .map(r => r.score);
  
  if (scores.length >= 2) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    results.agreement = {
      mean,
      stdDev,
      range: Math.max(...scores) - Math.min(...scores),
      coefficientOfVariation: mean > 0 ? stdDev / mean : 0
    };
  }
  
  return results;
}

/**
 * Compare with traditional accessibility tools (conceptual)
 * In practice, would integrate with axe-core, WAVE, etc.
 */
export async function compareWithAccessibilityTools(screenshotPath, html, css) {
  // This would integrate with:
  // - axe-core (npm package)
  // - WAVE API
  // - Pa11y
  // - Lighthouse
  
  console.log('   Comparing with traditional accessibility tools...');
  console.log('   (Integration with axe-core, WAVE, etc. not yet implemented)');
  
  return {
    axe: null, // Would contain axe-core results
    wave: null, // Would contain WAVE results
    lighthouse: null // Would contain Lighthouse results
  };
}

/**
 * Compare with research implementations
 * Based on papers and GitHub repos found
 */
export async function compareWithResearchMethods(screenshotPath, prompt) {
  // Research methods to compare:
  // - MLLM-as-a-Judge (from research papers)
  // - Image2Struct evaluation
  // - Other VLM benchmarks
  
  console.log('   Comparing with research methods...');
  console.log('   (Integration with research implementations not yet implemented)');
  
  return {
    mllmJudge: null,
    image2struct: null,
    otherMethods: []
  };
}

/**
 * Analyze differences between methods
 */
export function analyzeMethodDifferences(comparisons) {
  const analysis = {
    scoreDifferences: {},
    issueDifferences: {},
    agreement: {},
    recommendations: []
  };
  
  // Analyze score differences
  const providers = Object.keys(comparisons.providers || {})
    .filter(p => comparisons.providers[p].score !== null);
  
  if (providers.length >= 2) {
    const scores = providers.map(p => comparisons.providers[p].score);
    const maxDiff = Math.max(...scores) - Math.min(...scores);
    
    analysis.scoreDifferences = {
      maxDifference: maxDiff,
      providers: providers,
      scores: scores,
      isConsistent: maxDiff < 2.0 // Consider consistent if difference < 2.0
    };
    
    if (maxDiff >= 2.0) {
      analysis.recommendations.push('Large score differences between providers - consider ensemble judging');
    }
  }
  
  // Analyze issue detection differences
  const allIssues = new Set();
  providers.forEach(p => {
    (comparisons.providers[p].issues || []).forEach(issue => allIssues.add(issue));
  });
  
  analysis.issueDifferences = {
    totalUniqueIssues: allIssues.size,
    issuesByProvider: providers.reduce((acc, p) => {
      acc[p] = comparisons.providers[p].issues?.length || 0;
      return acc;
    }, {}),
    commonIssues: providers.length > 1 ? 
      providers.slice(1).reduce((common, p) => {
        const currentIssues = new Set(comparisons.providers[providers[0]].issues || []);
        const otherIssues = new Set(comparisons.providers[p].issues || []);
        return [...common].filter(i => otherIssues.has(i));
      }, [...new Set(comparisons.providers[providers[0]].issues || [])]) : []
  };
  
  return analysis;
}

/**
 * Generate comparison report
 */
export function generateComparisonReport(comparisons, analysis) {
  const lines = [];
  
  lines.push('📊 Method Comparison Report');
  lines.push('');
  
  // Provider comparison
  if (comparisons.providers) {
    lines.push('Provider Comparison:');
    Object.entries(comparisons.providers).forEach(([provider, result]) => {
      if (result.score !== null && result.score !== undefined) {
        lines.push(`  ${provider}:`);
        lines.push(`    Score: ${result.score.toFixed(2)}/10`);
        lines.push(`    Issues: ${result.issues?.length || 0}`);
        lines.push(`    Response Time: ${result.responseTime || 'N/A'}ms`);
        lines.push(`    Cost: $${(result.cost || 0).toFixed(6)}`);
      }
    });
    
    if (comparisons.providers.agreement) {
      lines.push('');
      lines.push('  Agreement:');
      lines.push(`    Mean Score: ${comparisons.providers.agreement.mean.toFixed(2)}`);
      lines.push(`    Std Dev: ${comparisons.providers.agreement.stdDev.toFixed(2)}`);
      lines.push(`    Range: ${comparisons.providers.agreement.range.toFixed(2)}`);
      lines.push(`    CV: ${(comparisons.providers.agreement.coefficientOfVariation * 100).toFixed(2)}%`);
    }
    lines.push('');
  }
  
  // Analysis
  if (analysis.scoreDifferences) {
    lines.push('Score Analysis:');
    lines.push(`  Max Difference: ${analysis.scoreDifferences.maxDifference.toFixed(2)}`);
    lines.push(`  Consistent: ${analysis.scoreDifferences.isConsistent ? '✅' : '❌'}`);
    lines.push('');
  }
  
  if (analysis.issueDifferences) {
    lines.push('Issue Detection:');
    lines.push(`  Total Unique Issues: ${analysis.issueDifferences.totalUniqueIssues}`);
    lines.push(`  Common Issues: ${analysis.issueDifferences.commonIssues.length}`);
    lines.push('');
  }
  
  if (analysis.recommendations.length > 0) {
    lines.push('Recommendations:');
    analysis.recommendations.forEach(rec => {
      lines.push(`  - ${rec}`);
    });
  }
  
  return lines.join('\n');
}

