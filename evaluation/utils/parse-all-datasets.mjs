#!/usr/bin/env node
/**
 * Parse All Datasets
 * 
 * Parses all available datasets into ground truth format:
 * - WCAG Test Cases
 * - WebUI Dataset
 * - Other datasets as they become available
 */

import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseWCAGTestCases } from './parse-wcag-testcases.mjs';
import { convertWebUIDataset } from './convert-webui-dataset.mjs';
import { parseAccessibilityDataset } from './parse-accessibility-dataset.mjs';

const DATASETS_DIR = join(process.cwd(), 'evaluation', 'datasets');
const OUTPUT_DIR = join(DATASETS_DIR);

/**
 * Parse WCAG dataset
 */
async function parseWCAG() {
  console.log('\n📋 Parsing WCAG Test Cases...');
  try {
    const dataset = parseWCAGTestCases();
    console.log(`   ✅ Parsed ${dataset.totalTestCases} test cases\n`);
    return { success: true, dataset };
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Parse WebUI dataset
 */
async function parseWebUI(options = {}) {
  console.log('📋 Parsing WebUI Dataset...');
  try {
    const limit = options.limit || null;
    const dataset = await convertWebUIDataset({ limit });
    if (dataset && dataset.samples) {
      console.log(`   ✅ Parsed ${dataset.samples.length} samples\n`);
      return { success: true, dataset };
    } else {
      console.log(`   ⚠️  No samples found\n`);
      return { success: false, error: 'No samples found' };
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Parse Accessibility dataset
 */
async function parseAccessibility() {
  console.log('📋 Parsing Accessibility Auditing Dataset...');
  try {
    const dataset = await parseAccessibilityDataset();
    if (dataset && dataset.samples) {
      console.log(`   ✅ Parsed ${dataset.samples.length} samples\n`);
      return { success: true, dataset };
    } else {
      console.log(`   ⚠️  Dataset not available or empty\n`);
      return { success: false, error: 'Dataset not available' };
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Check dataset availability
 */
function checkDatasetAvailability() {
  const datasets = {
    wcag: {
      name: 'WCAG Test Cases',
      available: existsSync(join(DATASETS_DIR, 'human-annotated', 'wcag-test-cases', 'testcases.json')),
      parsed: existsSync(join(DATASETS_DIR, 'wcag-ground-truth.json'))
    },
    webui: {
      name: 'WebUI Dataset',
      available: existsSync(join(DATASETS_DIR, 'human-annotated', 'visual-ui-understanding', 'webui-dataset', 'webui-7k')),
      parsed: existsSync(join(DATASETS_DIR, 'webui-ground-truth.json'))
    },
    accessibility: {
      name: 'Accessibility Auditing Dataset',
      available: existsSync(join(DATASETS_DIR, 'human-annotated', 'accessibility-auditing')) && 
                 readdirSync(join(DATASETS_DIR, 'human-annotated', 'accessibility-auditing')).some(f => 
                   f.endsWith('.json') || f.endsWith('.csv') || f.endsWith('.tsv')
                 ),
      parsed: existsSync(join(DATASETS_DIR, 'accessibility-ground-truth.json'))
    },
    uiElement: {
      name: 'UI Element Detection Dataset',
      available: false, // Check if downloaded
      parsed: false
    }
  };
  
  return datasets;
}

/**
 * Main parsing function
 */
async function parseAllDatasets(options = {}) {
  console.log('🔄 Parsing All Available Datasets\n');
  console.log('=' .repeat(50));
  
  const results = {
    wcag: null,
    webui: null,
    accessibility: null,
    timestamp: new Date().toISOString()
  };
  
  // Check availability
  const availability = checkDatasetAvailability();
  console.log('\n📊 Dataset Availability:');
  for (const [key, info] of Object.entries(availability)) {
    const status = info.available ? '✅' : '❌';
    const parsed = info.parsed ? ' (parsed)' : '';
    console.log(`   ${status} ${info.name}${parsed}`);
  }
  console.log();
  
  // Parse WCAG
  if (availability.wcag.available && (!availability.wcag.parsed || options.force)) {
    results.wcag = await parseWCAG();
  } else if (availability.wcag.parsed) {
    console.log('📋 WCAG Test Cases already parsed (use --force to re-parse)\n');
  } else {
    console.log('📋 WCAG Test Cases not available (download first)\n');
  }
  
  // Parse WebUI
  if (availability.webui.available && (!availability.webui.parsed || options.force)) {
    results.webui = await parseWebUI(options);
  } else if (availability.webui.parsed) {
    console.log('📋 WebUI Dataset already parsed (use --force to re-parse)\n');
  } else {
    console.log('📋 WebUI Dataset not available (download first)\n');
  }
  
  // Parse Accessibility
  if (availability.accessibility.available && (!availability.accessibility.parsed || options.force)) {
    results.accessibility = await parseAccessibility();
  } else if (availability.accessibility.parsed) {
    console.log('📋 Accessibility Dataset already parsed (use --force to re-parse)\n');
  } else {
    console.log('📋 Accessibility Dataset not available (download first)\n');
  }
  
  // Summary
  console.log('=' .repeat(50));
  console.log('\n📊 Parsing Summary:');
  const successful = Object.values(results).filter(r => r && r.success).length;
  const total = Object.keys(results).filter(k => k !== 'timestamp').length;
  console.log(`   ✅ Successfully parsed: ${successful}/${total} datasets\n`);
  
  // Write summary
  const summaryFile = join(OUTPUT_DIR, 'parsing-summary.json');
  writeFileSync(summaryFile, JSON.stringify(results, null, 2));
  console.log(`📝 Summary written to: ${summaryFile}\n`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force') || args.includes('-f'),
    limit: args.find(a => a.startsWith('--limit='))?.split('=')[1] || null
  };
  
  parseAllDatasets(options).catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { parseAllDatasets, checkDatasetAvailability };

