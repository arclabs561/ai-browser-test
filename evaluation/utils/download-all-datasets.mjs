#!/usr/bin/env node
/**
 * Download All Datasets
 * 
 * Downloads missing datasets based on download instructions.
 * Currently supports:
 * - WCAG Test Cases (already downloaded)
 * - WebUI Dataset (already downloaded)
 * - Accessibility Auditing Dataset (needs download)
 * - UI Element Detection Dataset (needs download)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const DATASETS_DIR = join(process.cwd(), 'evaluation', 'datasets', 'human-annotated');

/**
 * Download WCAG Test Cases
 */
async function downloadWCAG() {
  console.log('\n📥 Downloading WCAG Test Cases...');
  
  const wcagDir = join(DATASETS_DIR, 'wcag-test-cases');
  const testcasesFile = join(wcagDir, 'testcases.json');
  
  if (existsSync(testcasesFile)) {
    console.log('   ✅ Already downloaded\n');
    return { success: true, skipped: true };
  }
  
  try {
    // Download from W3C ACT Rules page
    const url = 'https://www.w3.org/WAI/standards-guidelines/act/rules/';
    console.log(`   🌐 Fetching from: ${url}`);
    
    const response = await fetch(url);
    const html = await response.text();
    
    mkdirSync(wcagDir, { recursive: true });
    writeFileSync(testcasesFile, html, 'utf-8');
    
    console.log('   ✅ Downloaded successfully\n');
    return { success: true, file: testcasesFile };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Download Accessibility Auditing Dataset
 * Source: https://www.mdpi.com/2306-5729/10/9/149
 */
async function downloadAccessibilityAuditing() {
  console.log('\n📥 Downloading Accessibility Auditing Dataset...');
  
  const accDir = join(DATASETS_DIR, 'accessibility-auditing');
  const instructionsFile = join(accDir, 'DOWNLOAD_INSTRUCTIONS.md');
  
  if (!existsSync(instructionsFile)) {
    console.log('   ⚠️  Download instructions not found\n');
    return { success: false, error: 'Instructions not found' };
  }
  
  const instructions = readFileSync(instructionsFile, 'utf-8');
  
  // Check if MDPI dataset is available
  // This typically requires manual download or API access
  console.log('   ℹ️  This dataset requires manual download from:');
  console.log('      https://www.mdpi.com/2306-5729/10/9/149');
  console.log('   💡 Please download manually and place files in:');
  console.log(`      ${accDir}\n`);
  
  return { success: false, error: 'Requires manual download', manual: true };
}

/**
 * Download UI Element Detection Dataset
 * Source: Apple Research
 */
async function downloadUIElementDetection() {
  console.log('\n📥 Downloading UI Element Detection Dataset...');
  
  const uiDir = join(DATASETS_DIR, 'ui-element-detection');
  const instructionsFile = join(uiDir, 'DOWNLOAD_INSTRUCTIONS.md');
  
  if (!existsSync(instructionsFile)) {
    console.log('   ⚠️  Download instructions not found\n');
    return { success: false, error: 'Instructions not found' };
  }
  
  console.log('   ℹ️  This dataset requires manual download from Apple Research');
  console.log('   💡 Please download manually and place files in:');
  console.log(`      ${uiDir}\n`);
  
  return { success: false, error: 'Requires manual download', manual: true };
}

/**
 * Check what needs downloading
 */
function checkDownloadStatus() {
  const status = {
    wcag: {
      name: 'WCAG Test Cases',
      downloaded: existsSync(join(DATASETS_DIR, 'wcag-test-cases', 'testcases.json')),
      needsDownload: false
    },
    webui: {
      name: 'WebUI Dataset',
      downloaded: existsSync(join(DATASETS_DIR, 'visual-ui-understanding', 'webui-dataset', 'webui-7k')),
      needsDownload: false
    },
    accessibility: {
      name: 'Accessibility Auditing Dataset',
      downloaded: false, // Check if files exist
      needsDownload: true,
      manual: true
    },
    uiElement: {
      name: 'UI Element Detection Dataset',
      downloaded: false, // Check if files exist
      needsDownload: true,
      manual: true
    }
  };
  
  return status;
}

/**
 * Main download function
 */
async function downloadAllDatasets(options = {}) {
  console.log('🔄 Downloading All Available Datasets\n');
  console.log('=' .repeat(50));
  
  const status = checkDownloadStatus();
  console.log('\n📊 Download Status:');
  for (const [key, info] of Object.entries(status)) {
    const icon = info.downloaded ? '✅' : '❌';
    const manual = info.manual ? ' (manual download required)' : '';
    console.log(`   ${icon} ${info.name}${manual}`);
  }
  console.log();
  
  const results = {
    wcag: null,
    accessibility: null,
    uiElement: null,
    timestamp: new Date().toISOString()
  };
  
  // Download WCAG if needed
  if (!status.wcag.downloaded || options.force) {
    results.wcag = await downloadWCAG();
  } else {
    console.log('📥 WCAG Test Cases already downloaded (use --force to re-download)\n');
  }
  
  // Try to download accessibility dataset
  if (options.includeManual || !status.accessibility.downloaded) {
    results.accessibility = await downloadAccessibilityAuditing();
  }
  
  // Try to download UI element dataset
  if (options.includeManual || !status.uiElement.downloaded) {
    results.uiElement = await downloadUIElementDetection();
  }
  
  // Summary
  console.log('=' .repeat(50));
  console.log('\n📊 Download Summary:');
  const downloaded = Object.values(results).filter(r => r && r.success && !r.skipped).length;
  const manual = Object.values(results).filter(r => r && r.manual).length;
  console.log(`   ✅ Downloaded: ${downloaded} datasets`);
  console.log(`   📋 Manual download required: ${manual} datasets\n`);
  
  // Write summary
  const summaryFile = join(process.cwd(), 'evaluation', 'datasets', 'download-summary.json');
  writeFileSync(summaryFile, JSON.stringify(results, null, 2));
  console.log(`📝 Summary written to: ${summaryFile}\n`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force') || args.includes('-f'),
    includeManual: args.includes('--include-manual') || args.includes('-m')
  };
  
  downloadAllDatasets(options).catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { downloadAllDatasets, checkDownloadStatus };

