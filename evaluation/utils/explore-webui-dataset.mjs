#!/usr/bin/env node
/**
 * Explore WebUI Dataset
 * 
 * Utility to explore and analyze the WebUI dataset structure and contents.
 */

import { loadWebUIDataset, getRandomWebUISamples, filterWebUISamples } from './load-webui-dataset.mjs';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const WEBUI_DATASET_DIR = join(process.cwd(), 'evaluation', 'datasets', 'human-annotated', 'visual-ui-understanding', 'webui-dataset', 'webui-7k');

/**
 * Analyze dataset structure
 */
function analyzeDatasetStructure() {
  console.log('📊 Analyzing WebUI Dataset Structure\n');
  
  const sampleDirs = readdirSync(WEBUI_DATASET_DIR)
    .filter(item => {
      const itemPath = join(WEBUI_DATASET_DIR, item);
      return statSync(itemPath).isDirectory();
    });
  
  console.log(`Total samples: ${sampleDirs.length}\n`);
  
  // Analyze first few samples
  const sampleStats = {
    hasScreenshot: 0,
    hasHtml: 0,
    hasAxtree: 0,
    hasBox: 0,
    hasStyle: 0,
    hasLinks: 0,
    viewports: new Set(),
    urls: new Set()
  };
  
  for (const sampleDir of sampleDirs.slice(0, 100)) {
    const files = readdirSync(join(WEBUI_DATASET_DIR, sampleDir));
    
    if (files.some(f => f.includes('screenshot'))) sampleStats.hasScreenshot++;
    if (files.some(f => f.includes('html'))) sampleStats.hasHtml++;
    if (files.some(f => f.includes('axtree'))) sampleStats.hasAxtree++;
    if (files.some(f => f.includes('box'))) sampleStats.hasBox++;
    if (files.some(f => f.includes('style'))) sampleStats.hasStyle++;
    if (files.some(f => f.includes('links'))) sampleStats.hasLinks++;
    
    // Extract viewport from screenshot filename
    const screenshot = files.find(f => f.includes('screenshot') && f.includes('-'));
    if (screenshot) {
      const match = screenshot.match(/(\d+)-(\d+)/);
      if (match) {
        sampleStats.viewports.add(`${match[1]}x${match[2]}`);
      }
    }
  }
  
  console.log('Sample Statistics (first 100 samples):');
  console.log(`  Screenshots: ${sampleStats.hasScreenshot}/100`);
  console.log(`  HTML: ${sampleStats.hasHtml}/100`);
  console.log(`  Accessibility Trees: ${sampleStats.hasAxtree}/100`);
  console.log(`  Bounding Boxes: ${sampleStats.hasBox}/100`);
  console.log(`  Styles: ${sampleStats.hasStyle}/100`);
  console.log(`  Links: ${sampleStats.hasLinks}/100`);
  console.log(`  Viewports: ${Array.from(sampleStats.viewports).join(', ')}`);
}

/**
 * Show sample information
 */
async function showSampleInfo(limit = 5) {
  console.log(`\n📋 Sample Information (${limit} random samples)\n`);
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  if (!dataset || !dataset.samples || dataset.samples.length === 0) {
    console.log('⚠️  No samples available. Run: node evaluation/utils/convert-webui-dataset.mjs first');
    return;
  }
  
  const samples = getRandomWebUISamples(dataset, limit);
  
  for (const sample of samples) {
    console.log(`Sample ID: ${sample.id}`);
    console.log(`  URL: ${sample.url || 'N/A'}`);
    console.log(`  Viewport: ${sample.viewport ? `${sample.viewport.width}x${sample.viewport.height}` : 'N/A'}`);
    console.log(`  Screenshot: ${sample.screenshot ? '✅' : '❌'}`);
    console.log(`  Annotations:`);
    console.log(`    - Accessibility Tree: ${sample.annotations?.accessibilityTree ? '✅' : '❌'}`);
    console.log(`    - Bounding Boxes: ${sample.annotations?.boundingBoxes ? '✅' : '❌'}`);
    console.log(`    - Styles: ${sample.annotations?.styles ? '✅' : '❌'}`);
    console.log(`    - HTML: ${sample.annotations?.html ? '✅' : '❌'}`);
    console.log('');
  }
}

/**
 * Filter and show samples
 */
async function showFilteredSamples(criteria) {
  console.log(`\n🔍 Filtered Samples\n`);
  console.log(`Criteria: ${JSON.stringify(criteria, null, 2)}\n`);
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  if (!dataset || !dataset.samples || dataset.samples.length === 0) {
    console.log('⚠️  No samples available. Run: node evaluation/utils/convert-webui-dataset.mjs first');
    return;
  }
  
  const filtered = filterWebUISamples(dataset, criteria);
  console.log(`Found ${filtered.length} matching samples\n`);
  
  if (filtered.length > 0) {
    console.log('First 5 samples:');
    for (const sample of filtered.slice(0, 5)) {
      console.log(`  - ${sample.id}: ${sample.url || 'N/A'} (${sample.viewport ? `${sample.viewport.width}x${sample.viewport.height}` : 'N/A'})`);
    }
  }
}

async function main() {
  const command = process.argv[2] || 'structure';
  
  switch (command) {
    case 'structure':
      analyzeDatasetStructure();
      break;
    case 'samples':
      const limit = parseInt(process.argv[3]) || 5;
      await showSampleInfo(limit);
      break;
    case 'filter':
      const criteria = {
        hasAccessibilityTree: process.argv.includes('--has-axtree'),
        hasBoundingBoxes: process.argv.includes('--has-boxes'),
        viewport: process.argv.includes('--viewport') ? {
          width: parseInt(process.argv[process.argv.indexOf('--viewport') + 1]) || null,
          height: parseInt(process.argv[process.argv.indexOf('--viewport') + 2]) || null
        } : null
      };
      await showFilteredSamples(criteria);
      break;
    default:
      console.log('Usage:');
      console.log('  node evaluation/utils/explore-webui-dataset.mjs structure');
      console.log('  node evaluation/utils/explore-webui-dataset.mjs samples [limit]');
      console.log('  node evaluation/utils/explore-webui-dataset.mjs filter [--has-axtree] [--has-boxes] [--viewport width height]');
  }
}

main().catch(console.error);

