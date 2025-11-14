#!/usr/bin/env node
/**
 * Complete Dataset Downloads
 * 
 * Downloads actual datasets we can use for validation.
 * Uses .env for any required credentials.
 */

import { loadEnv } from '../src/load-env.mjs';
import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Load .env
loadEnv();

const DATASETS_DIR = join(process.cwd(), 'evaluation', 'datasets', 'human-annotated');

console.log('📥 Completing Dataset Downloads\n');

// 1. WebUI Dataset
console.log('1. WebUI Dataset');
const webuiDir = join(DATASETS_DIR, 'visual-ui-understanding', 'webui-repo');
if (existsSync(webuiDir)) {
  console.log('   ✅ Repository exists');
  
  // Check for download instructions
  const readmePath = join(webuiDir, 'README.md');
  if (existsSync(readmePath)) {
    const readme = readFileSync(readmePath, 'utf-8');
    console.log('   📝 README found');
    
    // Look for download commands
    if (readme.includes('download') || readme.includes('wget') || readme.includes('curl')) {
      console.log('   ⚠️  Manual download required - see README.md');
      console.log(`   📄 Path: ${readmePath}`);
    } else {
      console.log('   ℹ️  No download instructions found in README');
    }
  } else {
    console.log('   ⚠️  README.md not found');
  }
} else {
  console.log('   ❌ Repository not found - run scripts/download-datasets.mjs first');
}

// 2. WCAG Test Cases
console.log('\n2. WCAG Test Cases');
const wcagDir = join(DATASETS_DIR, 'wcag-test-cases');
const wcagScript = join(wcagDir, 'download.sh');

if (existsSync(wcagScript)) {
  console.log('   ✅ Download script exists');
  console.log('   📝 Run: bash evaluation/datasets/human-annotated/wcag-test-cases/download.sh');
} else {
  console.log('   ⚠️  Download script not found');
}

// 3. Create status report
const status = {
  timestamp: new Date().toISOString(),
  datasets: {
    webui: {
      status: existsSync(webuiDir) ? 'repository-cloned' : 'not-cloned',
      path: webuiDir,
      hasReadme: existsSync(join(webuiDir, 'README.md')),
      nextStep: 'Follow README.md for dataset download'
    },
    wcag: {
      status: existsSync(wcagScript) ? 'script-created' : 'not-created',
      path: wcagScript,
      nextStep: 'Run download.sh to fetch test cases'
    }
  },
  note: 'Most datasets require manual download or API access. See individual dataset directories for instructions.'
};

const statusPath = join(DATASETS_DIR, 'download-status.json');
writeFileSync(statusPath, JSON.stringify(status, null, 2));

console.log('\n✅ Status saved:', statusPath);
console.log('\n📋 Next Steps:');
console.log('   1. Check WebUI repository README for download instructions');
console.log('   2. Run WCAG download script if available');
console.log('   3. Check other dataset sources for download methods');
console.log('   4. Convert downloaded datasets to our format');

