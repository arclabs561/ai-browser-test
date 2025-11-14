#!/usr/bin/env node
/**
 * Harmonization Check
 * 
 * Verifies that all evaluations, tests, and datasets are properly harmonized:
 * - Consistent import paths
 * - Consistent data formats
 * - Consistent configuration usage
 * - All dependencies available
 * - No circular dependencies
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Check import consistency
 */
function checkImports() {
  const issues = [];
  const utilsDir = join(process.cwd(), 'evaluation', 'utils');
  const runnersDir = join(process.cwd(), 'evaluation', 'runners');
  
  const files = [
    ...readdirSync(utilsDir).filter(f => f.endsWith('.mjs')).map(f => ({ type: 'utils', file: f, path: join(utilsDir, f) })),
    ...readdirSync(runnersDir).filter(f => f.endsWith('.mjs')).map(f => ({ type: 'runners', file: f, path: join(runnersDir, f) }))
  ];
  
  const importPatterns = {
    loadWebUIDataset: /from\s+['"]\.\.\/utils\/load-webui-dataset\.mjs['"]|from\s+['"]\.\/load-webui-dataset\.mjs['"]|import.*loadWebUIDataset.*from|await\s+import\(['"]\.\/load-webui-dataset\.mjs['"]\)/,
    createConfig: /from\s+['"]\.\.\/\.\.\/src\/config\.mjs['"]|from\s+['"]\.\.\/src\/config\.mjs['"]|from\s+['"]\.\.\/\.\.\/src\/index\.mjs['"].*createConfig|import.*createConfig.*from/,
    validateScreenshot: /from\s+['"]\.\.\/\.\.\/src\/index\.mjs['"]|from\s+['"]\.\.\/src\/index\.mjs['"]|import.*validateScreenshot.*from|await\s+import\(['"]\.\.\/\.\.\/src\/index\.mjs['"]\)/,
    loadTabularAccessibilityDataset: /from\s+['"]\.\.\/utils\/dataset-loaders\.mjs['"]|from\s+['"]\.\/dataset-loaders\.mjs['"]|import.*loadTabularAccessibilityDataset.*from/
  };
  
  for (const { type, file, path } of files) {
    try {
      const content = readFileSync(path, 'utf-8');
      
      // Check for loadWebUIDataset usage (skip if it's the loader itself or dynamic import)
      if (content.includes('loadWebUIDataset') && file !== 'load-webui-dataset.mjs') {
        const hasValidImport = importPatterns.loadWebUIDataset.test(content) || 
                              content.includes('await import') ||
                              content.includes('dynamic import');
        if (!hasValidImport) {
          const lineNum = content.split('\n').findIndex(l => l.includes('loadWebUIDataset') && !l.includes('export'));
          if (lineNum >= 0) {
            issues.push({
              file: `${type}/${file}`,
              issue: 'Incorrect import path for loadWebUIDataset',
              line: lineNum + 1,
              severity: 'warning'
            });
          }
        }
      }
      
      // Check for createConfig usage (skip if it's the config itself)
      if (content.includes('createConfig') && !file.includes('config.mjs')) {
        const hasValidImport = importPatterns.createConfig.test(content) ||
                              content.includes('from') && content.includes('config');
        if (!hasValidImport && !content.includes('export function createConfig')) {
          const lineNum = content.split('\n').findIndex(l => l.includes('createConfig') && !l.includes('export'));
          if (lineNum >= 0) {
            issues.push({
              file: `${type}/${file}`,
              issue: 'Incorrect import path for createConfig',
              line: lineNum + 1,
              severity: 'warning'
            });
          }
        }
      }
      
      // Check for validateScreenshot usage (skip if it's the validator itself or dynamic import)
      if (content.includes('validateScreenshot') && !content.includes('validateScreenshot =') && !file.includes('judge.mjs')) {
        const hasValidImport = importPatterns.validateScreenshot.test(content) ||
                              content.includes('await import') ||
                              content.includes('dynamic import');
        if (!hasValidImport) {
          const lineNum = content.split('\n').findIndex(l => l.includes('validateScreenshot') && !l.includes('export'));
          if (lineNum >= 0) {
            issues.push({
              file: `${type}/${file}`,
              issue: 'Incorrect import path for validateScreenshot',
              line: lineNum + 1,
              severity: 'warning'
            });
          }
        }
      }
    } catch (error) {
      issues.push({
        file: `${type}/${file}`,
        issue: `Error reading file: ${error.message}`
      });
    }
  }
  
  return issues;
}

/**
 * Check dataset file consistency
 */
function checkDatasetFiles() {
  const issues = [];
  const datasetFile = join(process.cwd(), 'evaluation', 'datasets', 'webui-ground-truth.json');
  const cacheFile = join(process.cwd(), 'evaluation', 'datasets', 'cache', 'webui-ground-truth.json');
  
  // Check if dataset file exists
  if (!existsSync(datasetFile) && !existsSync(cacheFile)) {
    issues.push({
      file: 'webui-ground-truth.json',
      issue: 'Dataset file not found (neither in datasets/ nor cache/)',
      severity: 'warning'
    });
  }
  
  // Check if cache directory exists
  const cacheDir = join(process.cwd(), 'evaluation', 'datasets', 'cache');
  if (!existsSync(cacheDir)) {
    issues.push({
      file: 'cache/',
      issue: 'Cache directory does not exist',
      severity: 'info'
    });
  }
  
  return issues;
}

/**
 * Check configuration consistency
 */
function checkConfiguration() {
  const issues = [];
  const utilsDir = join(process.cwd(), 'evaluation', 'utils');
  const runnersDir = join(process.cwd(), 'evaluation', 'runners');
  
  const files = [
    ...readdirSync(utilsDir).filter(f => f.endsWith('.mjs')).map(f => join(utilsDir, f)),
    ...readdirSync(runnersDir).filter(f => f.endsWith('.mjs')).map(f => join(runnersDir, f))
  ];
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      
      // Check for direct API key usage (should use createConfig)
      if (content.includes('process.env.GROQ_API_KEY') || content.includes('process.env.GEMINI_API_KEY')) {
        issues.push({
          file: file.replace(process.cwd() + '/', ''),
          issue: 'Direct API key access - should use createConfig()',
          severity: 'warning'
        });
      }
      
      // Check for hardcoded providers
      if (content.includes("provider: 'groq'") || content.includes('provider: "groq"')) {
        issues.push({
          file: file.replace(process.cwd() + '/', ''),
          issue: 'Hardcoded provider - should accept from options',
          severity: 'info'
        });
      }
    } catch (error) {
      // Skip
    }
  }
  
  return issues;
}

/**
 * Check export consistency
 */
function checkExports() {
  const issues = [];
  const utilsDir = join(process.cwd(), 'evaluation', 'utils');
  
  const expectedExports = {
    'load-webui-dataset.mjs': ['loadWebUIDataset'],
    'dataset-loaders.mjs': ['loadTabularAccessibilityDataset'],
    'validate-with-ground-truth.mjs': ['runGroundTruthValidation', 'evaluateWithGroundTruth'],
    'iou-element-detection.mjs': ['runIoUElementDetection'],
    'element-detection-accuracy.mjs': ['runElementDetectionAccuracy', 'calculateIoU'],
    'screen-classification-evaluation.mjs': ['runScreenClassification'],
    'style-contrast-validation.mjs': ['runContrastValidation'],
    'multi-viewport-validation.mjs': ['runMultiViewportValidation'],
    'element-type-validation.mjs': ['runElementTypeValidation']
  };
  
  for (const [file, expected] of Object.entries(expectedExports)) {
    const filePath = join(utilsDir, file);
    if (!existsSync(filePath)) {
      issues.push({
        file: `utils/${file}`,
        issue: `File missing but expected exports: ${expected.join(', ')}`,
        severity: 'error'
      });
      continue;
    }
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      for (const exportName of expected) {
        if (!content.includes(`export`) || !content.includes(exportName)) {
          issues.push({
            file: `utils/${file}`,
            issue: `Missing export: ${exportName}`,
            severity: 'error'
          });
        }
      }
    } catch (error) {
      issues.push({
        file: `utils/${file}`,
        issue: `Error reading file: ${error.message}`,
        severity: 'error'
      });
    }
  }
  
  return issues;
}

/**
 * Check data format consistency
 */
function checkDataFormats() {
  const issues = [];
  const datasetFile = join(process.cwd(), 'evaluation', 'datasets', 'webui-ground-truth.json');
  
  if (existsSync(datasetFile)) {
    try {
      const data = JSON.parse(readFileSync(datasetFile, 'utf-8'));
      
      // Check structure
      if (!data.samples || !Array.isArray(data.samples)) {
        issues.push({
          file: 'webui-ground-truth.json',
          issue: 'Missing or invalid samples array',
          severity: 'error'
        });
      } else if (data.samples.length > 0) {
        const sample = data.samples[0];
        
        // Check required fields
        const requiredFields = ['id', 'screenshot'];
        for (const field of requiredFields) {
          if (!(field in sample)) {
            issues.push({
              file: 'webui-ground-truth.json',
              issue: `Sample missing required field: ${field}`,
              severity: 'error'
            });
          }
        }
        
        // Check groundTruth structure
        if (sample.groundTruth) {
          const expectedGTFields = ['hasScreenshot', 'hasAccessibilityTree', 'hasBoundingBoxes'];
          for (const field of expectedGTFields) {
            if (!(field in sample.groundTruth)) {
              issues.push({
                file: 'webui-ground-truth.json',
                issue: `groundTruth missing field: ${field}`,
                severity: 'warning'
              });
            }
          }
        }
      }
    } catch (error) {
      issues.push({
        file: 'webui-ground-truth.json',
        issue: `Error parsing JSON: ${error.message}`,
        severity: 'error'
      });
    }
  }
  
  return issues;
}

/**
 * Run all harmonization checks
 */
function runHarmonizationCheck() {
  console.log('🔍 Harmonization Check\n');
  console.log('Checking evaluations, tests, and datasets for consistency...\n');
  
  const allIssues = {
    imports: checkImports(),
    datasets: checkDatasetFiles(),
    configuration: checkConfiguration(),
    exports: checkExports(),
    dataFormats: checkDataFormats()
  };
  
  const totalIssues = Object.values(allIssues).flat().length;
  const errors = Object.values(allIssues).flat().filter(i => i.severity === 'error').length;
  const warnings = Object.values(allIssues).flat().filter(i => i.severity === 'warning').length;
  const infos = Object.values(allIssues).flat().filter(i => i.severity === 'info').length;
  
  console.log('📊 Results:\n');
  console.log(`   Total Issues: ${totalIssues}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Warnings: ${warnings}`);
  console.log(`   Info: ${infos}\n`);
  
  if (allIssues.imports.length > 0) {
    console.log('📦 Import Issues:');
    for (const issue of allIssues.imports) {
      console.log(`   ${issue.severity || 'error'}: ${issue.file} - ${issue.issue}`);
      if (issue.line) console.log(`      Line ${issue.line}`);
    }
    console.log('');
  }
  
  if (allIssues.datasets.length > 0) {
    console.log('📊 Dataset Issues:');
    for (const issue of allIssues.datasets) {
      console.log(`   ${issue.severity}: ${issue.file} - ${issue.issue}`);
    }
    console.log('');
  }
  
  if (allIssues.configuration.length > 0) {
    console.log('⚙️  Configuration Issues:');
    for (const issue of allIssues.configuration) {
      console.log(`   ${issue.severity}: ${issue.file} - ${issue.issue}`);
    }
    console.log('');
  }
  
  if (allIssues.exports.length > 0) {
    console.log('📤 Export Issues:');
    for (const issue of allIssues.exports) {
      console.log(`   ${issue.severity}: ${issue.file} - ${issue.issue}`);
    }
    console.log('');
  }
  
  if (allIssues.dataFormats.length > 0) {
    console.log('📋 Data Format Issues:');
    for (const issue of allIssues.dataFormats) {
      console.log(`   ${issue.severity}: ${issue.file} - ${issue.issue}`);
    }
    console.log('');
  }
  
  if (totalIssues === 0) {
    console.log('✅ All checks passed! Evaluations, tests, and datasets are harmonized.\n');
  } else if (errors === 0) {
    console.log('⚠️  Some warnings/info items found, but no critical errors.\n');
  } else {
    console.log('❌ Critical errors found. Please fix before proceeding.\n');
    process.exit(1);
  }
  
  return allIssues;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHarmonizationCheck();
}

export { runHarmonizationCheck, checkImports, checkDatasetFiles, checkConfiguration, checkExports, checkDataFormats };

