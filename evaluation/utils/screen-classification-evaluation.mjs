#!/usr/bin/env node
/**
 * Screen Classification Evaluation
 * 
 * Implements screen classification task as described in WebUI paper.
 * Uses VLLM to classify screens into categories and validates against
 * URL patterns or other heuristics.
 */

import { loadWebUIDataset } from './load-webui-dataset.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Infer screen category from URL
 */
function inferCategoryFromURL(url) {
  if (!url) return 'unknown';
  
  const urlLower = url.toLowerCase();
  
  // Common patterns
  if (urlLower.includes('login') || urlLower.includes('signin') || urlLower.includes('auth')) {
    return 'login';
  }
  if (urlLower.includes('signup') || urlLower.includes('register') || urlLower.includes('create-account')) {
    return 'signup';
  }
  if (urlLower.includes('home') || urlLower.includes('index') || urlLower.match(/^https?:\/\/[^\/]+$/)) {
    return 'home';
  }
  if (urlLower.includes('product') || urlLower.includes('item') || urlLower.includes('shop')) {
    return 'product';
  }
  if (urlLower.includes('cart') || urlLower.includes('checkout') || urlLower.includes('basket')) {
    return 'cart';
  }
  if (urlLower.includes('profile') || urlLower.includes('account') || urlLower.includes('user')) {
    return 'profile';
  }
  if (urlLower.includes('search') || urlLower.includes('query')) {
    return 'search';
  }
  if (urlLower.includes('blog') || urlLower.includes('article') || urlLower.includes('post')) {
    return 'article';
  }
  if (urlLower.includes('about') || urlLower.includes('contact')) {
    return 'about';
  }
  
  return 'other';
}

/**
 * Evaluate screen classification
 */
async function evaluateScreenClassification(sample, options = {}) {
  const { provider = null } = options;
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'vllm_disabled'
    };
  }
  
  const prompt = `Classify this webpage screenshot into one of these categories:

- login (login/sign-in pages)
- signup (registration pages)
- home (homepage/landing pages)
- product (product/item pages)
- cart (shopping cart/checkout)
- profile (user profile/account pages)
- search (search results pages)
- article (blog/article pages)
- about (about/contact pages)
- other (other types)

Provide:
1. The category name
2. Confidence level (0-1)
3. Brief reasoning`;
  
  const vllmResult = await validateScreenshot(
    sample.screenshot,
    prompt,
    {
      provider: config.provider,
      apiKey: config.apiKey,
      testType: 'screen-classification',
      viewport: sample.viewport
    }
  );
  
  // Extract category from VLLM response
  const text = (vllmResult.reasoning || '').toLowerCase() + ' ' + (vllmResult.issues || []).join(' ').toLowerCase();
  const categories = ['login', 'signup', 'home', 'product', 'cart', 'profile', 'search', 'article', 'about', 'other'];
  let predictedCategory = 'other';
  let confidence = 0.5;
  
  for (const category of categories) {
    if (text.includes(category)) {
      predictedCategory = category;
      // Try to extract confidence
      const confMatch = text.match(/confidence[:\s]+([\d.]+)/i);
      if (confMatch) {
        confidence = parseFloat(confMatch[1]);
      }
      break;
    }
  }
  
  // Infer ground truth from URL
  const groundTruthCategory = inferCategoryFromURL(sample.url);
  const correct = predictedCategory === groundTruthCategory;
  
  return {
    sampleId: sample.id,
    url: sample.url,
    predictedCategory,
    groundTruthCategory,
    correct,
    confidence,
    vllmResult: {
      reasoning: vllmResult.reasoning,
      issues: vllmResult.issues || []
    }
  };
}

/**
 * Run screen classification evaluation
 */
async function runScreenClassification(options = {}) {
  const { limit = 20, provider = null } = options;
  
  console.log('📋 Screen Classification Evaluation\n');
  console.log('Classifying screens into categories (as in WebUI paper)\n');
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  const samples = dataset.samples.slice(0, limit);
  
  console.log(`📊 Classifying ${samples.length} screens\n`);
  
  const results = [];
  let correct = 0;
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    console.log(`[${i + 1}/${samples.length}] ${sample.id}`);
    
    try {
      const result = await evaluateScreenClassification(sample, { provider: config.provider });
      results.push(result);
      
      if (result.correct) {
        correct++;
        console.log(`   ✅ ${result.predictedCategory} (GT: ${result.groundTruthCategory})`);
      } else {
        console.log(`   ❌ ${result.predictedCategory} (GT: ${result.groundTruthCategory})`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        sampleId: sample.id,
        status: 'error',
        error: error.message
      });
    }
  }
  
  const accuracy = results.filter(r => r.correct !== undefined).length > 0
    ? correct / results.filter(r => r.correct !== undefined).length
    : 0;
  
  // Per-category accuracy
  const categoryStats = {};
  for (const result of results) {
    if (result.groundTruthCategory) {
      if (!categoryStats[result.groundTruthCategory]) {
        categoryStats[result.groundTruthCategory] = { total: 0, correct: 0 };
      }
      categoryStats[result.groundTruthCategory].total++;
      if (result.correct) {
        categoryStats[result.groundTruthCategory].correct++;
      }
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Correct: ${correct}`);
  console.log(`   Accuracy: ${(accuracy * 100).toFixed(1)}%`);
  console.log(`\n   Per-Category:`);
  for (const [category, stats] of Object.entries(categoryStats)) {
    const catAccuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    console.log(`     ${category}: ${stats.correct}/${stats.total} (${catAccuracy.toFixed(1)}%)`);
  }
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `screen-classification-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    provider: config.provider,
    totalSamples: results.length,
    accuracy,
    categoryStats,
    results
  }, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return { results, accuracy, categoryStats };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 20;
  const provider = process.argv[3] || null;
  runScreenClassification({ limit, provider }).catch(console.error);
}

export { runScreenClassification, evaluateScreenClassification, inferCategoryFromURL };

