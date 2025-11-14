#!/usr/bin/env node
/**
 * Run Dataset Downloads
 * 
 * Automates dataset downloads where possible:
 * 1. WebUI Dataset (smallest subset - webui-7k)
 * 2. WCAG Test Cases
 * 3. Other available datasets
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATASETS_DIR = join(process.cwd(), 'evaluation', 'datasets', 'human-annotated');

console.log('📥 Running Dataset Downloads\n');

// 1. WCAG Test Cases
console.log('1. WCAG Test Cases');
const wcagDir = join(DATASETS_DIR, 'wcag-test-cases');
const wcagScript = join(wcagDir, 'download.sh');

if (existsSync(wcagScript)) {
  try {
    console.log('   Running download script...');
    execSync(`bash ${wcagScript}`, { 
      cwd: wcagDir,
      stdio: 'inherit'
    });
    console.log('   ✅ WCAG download completed');
  } catch (error) {
    console.log('   ⚠️  WCAG download failed (may need manual download)');
  }
} else {
  console.log('   ⚠️  Download script not found');
}

// 2. WebUI Dataset (smallest subset)
console.log('\n2. WebUI Dataset (webui-7k subset)');
const webuiDir = join(DATASETS_DIR, 'visual-ui-understanding', 'webui-repo');
const downloaderPath = join(webuiDir, 'downloads', 'downloader.py');

if (existsSync(downloaderPath)) {
  // Check if gdown is available
  let gdownAvailable = false;
  try {
    execSync('python3 -c "import gdown"', { stdio: 'pipe' });
    gdownAvailable = true;
    console.log('   ✅ gdown available');
  } catch (gdownError) {
    console.log('   ⚠️  gdown not available - install with: pip install --break-system-packages gdown');
    console.log('   📝 Manual: Follow README.md in webui-repo for download instructions');
  }
  
  if (gdownAvailable) {
    try {
      // Create a small script to download webui-7k
      const outputDir = join(DATASETS_DIR, 'visual-ui-understanding', 'webui-dataset');
      const tmpPath = join(webuiDir, 'downloads', 'tmp');
      const datasetPath = join(outputDir, 'webui-7k');
      
      const downloadScript = `import sys
sys.path.insert(0, '${webuiDir}/downloads')
from downloader import download_dataset_gdown
import os

# Download smallest subset (webui-7k)
output_dir = '${outputDir}'
os.makedirs(output_dir, exist_ok=True)
os.chdir('${webuiDir}/downloads')

print("Downloading webui-7k dataset (this may take a while - several GB)...")
print("⚠️  This is a large download. Press Ctrl+C to cancel if needed.")
download_dataset_gdown("webui-7k", tmp_path="${tmpPath}", dataset_path="${datasetPath}")
print("✅ Download completed")
`;
      
      const scriptPath = join(webuiDir, 'downloads', 'download_webui7k.py');
      writeFileSync(scriptPath, downloadScript);
      
      console.log('   📥 Starting download (this may take a while - several GB)...');
      console.log('   ⚠️  Large download in progress. This may take 10-30 minutes depending on connection.');
      execSync(`python3 ${scriptPath}`, { 
        cwd: webuiDir,
        stdio: 'inherit'
      });
      console.log('   ✅ WebUI-7k download completed');
    } catch (error) {
      console.log('   ⚠️  WebUI download failed:', error.message);
      console.log('   📝 Manual: Follow README.md in webui-repo for download instructions');
    }
  }
} else {
  console.log('   ⚠️  Downloader script not found');
}

console.log('\n✅ Dataset download process completed');
console.log('📋 Check individual dataset directories for downloaded files');

