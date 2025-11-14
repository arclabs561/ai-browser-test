#!/usr/bin/env node
/**
 * Dataset Loaders
 * 
 * Loads and processes various evaluation datasets:
 * - WebUI Dataset
 * - Tabular Accessibility Dataset
 * - WCAG Test Cases
 * - Custom annotated datasets
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const DATASETS_DIR = join(process.cwd(), 'evaluation', 'datasets');
// Use same cache location as load-webui-dataset.mjs for consistency
const CACHE_DIR = join(process.cwd(), 'evaluation', 'datasets');

// Ensure directories exist
[DATASETS_DIR, CACHE_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

/**
 * Load WebUI Dataset
 * Downloads and processes WebUI dataset from HuggingFace or GitHub
 */
export async function loadWebUIDataset(options = {}) {
  // Use the new implementation
  try {
    const { loadWebUIDataset: loadNew } = await import('./load-webui-dataset.mjs');
    return await loadNew(options);
  } catch (error) {
    console.warn(`⚠️  Error loading WebUI dataset with new loader: ${error.message}`);
    // Fallback to old implementation if it exists
    return null;
  }
}

export async function loadWebUIDataset_OLD(options = {}) {
  const {
    limit = null, // Limit number of samples
    cache = true
  } = options;
  
  const cacheFile = join(CACHE_DIR, '.webui-cache.json');
  
  // Check cache
  if (cache && existsSync(cacheFile)) {
    console.log('📦 Loading WebUI dataset from cache...');
    const cached = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    return limit ? cached.slice(0, limit) : cached;
  }
  
  console.log('📥 Downloading WebUI dataset...');
  
  // Try to download from HuggingFace
  try {
    // WebUI-7K is available on HuggingFace
    const datasetUrl = 'https://huggingface.co/datasets/biglab/webui-7k';
    console.log(`   Source: ${datasetUrl}`);
    console.log('   Note: Manual download may be required');
    
    // For now, return structure - user needs to download manually
    return {
      name: 'WebUI-7K',
      source: datasetUrl,
      description: '7K web pages with visual UI understanding annotations',
      samples: [],
      metadata: {
        totalSamples: 7000,
        features: ['screenshot', 'html', 'css', 'semantic_annotations'],
        downloadInstructions: 'Download from HuggingFace or GitHub repository'
      }
    };
  } catch (error) {
    console.error('Failed to load WebUI dataset:', error.message);
    return null;
  }
}

/**
 * Load Tabular Accessibility Dataset
 * Processes accessibility evaluation dataset
 */
export async function loadTabularAccessibilityDataset(options = {}) {
  const {
    limit = null,
    cache = true
  } = options;
  
  const cacheFile = join(CACHE_DIR, '.tabular-accessibility-cache.json');
  
  if (cache && existsSync(cacheFile)) {
    console.log('📦 Loading Tabular Accessibility dataset from cache...');
    const cached = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    return limit ? cached.slice(0, limit) : cached;
  }
  
  console.log('📥 Loading Tabular Accessibility dataset...');
  
  // Dataset structure based on research paper
  return {
    name: 'Tabular Accessibility Dataset',
    source: 'https://www.mdpi.com/2306-5729/10/9/149',
    description: 'WCAG compliance annotations for LLM-based accessibility auditing',
    samples: [],
    metadata: {
      features: ['url', 'wcag_violations', 'ground_truth', 'annotations'],
      wcagLevels: ['A', 'AA', 'AAA'],
      downloadInstructions: 'Contact authors or check research paper for dataset access'
    }
  };
}

/**
 * Create synthetic test dataset from real websites
 * Captures screenshots and creates ground truth annotations
 */
export async function createSyntheticDataset(websites, options = {}) {
  const {
    outputFile = join(DATASETS_DIR, 'synthetic-dataset.json'),
    usePlaywright = true
  } = options;
  
  console.log(`📸 Creating synthetic dataset from ${websites.length} websites...`);
  
  const dataset = {
    name: 'Synthetic Real-World Dataset',
    created: new Date().toISOString(),
    samples: []
  };
  
  if (!usePlaywright) {
    console.warn('⚠️  Playwright not available. Creating dataset structure only.');
    return dataset;
  }
  
  // Check if Playwright is available
  const playwrightAvailable = existsSync(join(process.cwd(), 'node_modules', '@playwright', 'test'));
  
  if (!playwrightAvailable) {
    console.warn('⚠️  Playwright not installed. Install with: npm install @playwright/test');
    return dataset;
  }
  
  // For each website, we would:
  // 1. Capture screenshot
  // 2. Extract HTML/CSS
  // 3. Create ground truth annotations
  // 4. Add to dataset
  
  // This is a placeholder - actual implementation would use Playwright
  for (const website of websites) {
    dataset.samples.push({
      id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: website.url,
      name: website.name,
      screenshot: null, // Would be path to screenshot
      html: null, // Would be extracted HTML
      css: null, // Would be extracted CSS
      groundTruth: {
        score: website.expectedScore || null,
        issues: website.expectedIssues || [],
        annotations: website.annotations || {}
      },
      metadata: {
        viewport: website.viewport || { width: 1280, height: 720 },
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Save dataset
  writeFileSync(outputFile, JSON.stringify(dataset, null, 2));
  console.log(`✅ Dataset saved to: ${outputFile}`);
  
  return dataset;
}

/**
 * Load custom annotated dataset from JSON file
 */
export function loadCustomDataset(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Dataset file not found: ${filePath}`);
  }
  
  console.log(`📂 Loading custom dataset from: ${filePath}`);
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  
  return {
    name: data.name || 'Custom Dataset',
    samples: data.samples || [],
    metadata: data.metadata || {}
  };
}

/**
 * Validate dataset structure
 */
export function validateDataset(dataset) {
  const errors = [];
  
  if (!dataset.name) {
    errors.push('Dataset missing name');
  }
  
  if (!Array.isArray(dataset.samples)) {
    errors.push('Dataset samples must be an array');
    return { valid: false, errors };
  }
  
  // Validate sample structure
  dataset.samples.forEach((sample, index) => {
    if (!sample.id) {
      errors.push(`Sample ${index} missing id`);
    }
    if (!sample.groundTruth) {
      errors.push(`Sample ${index} missing groundTruth`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    sampleCount: dataset.samples.length
  };
}

export { DATASETS_DIR, CACHE_DIR };

