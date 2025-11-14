#!/usr/bin/env node
/**
 * Convert WebUI Dataset to Ground Truth Format
 * 
 * Converts WebUI dataset samples to our standardized ground truth format
 * for use in evaluations.
 */

import { readdirSync, readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { readGzippedJson } from './gzip-utils.mjs';

const WEBUI_DATASET_DIR = join(process.cwd(), 'evaluation', 'datasets', 'human-annotated', 'visual-ui-understanding', 'webui-dataset', 'webui-7k');
const OUTPUT_FILE = join(process.cwd(), 'evaluation', 'datasets', 'webui-ground-truth.json');


/**
 * Read regular JSON file
 */
function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

/**
 * Read text file
 */
function readText(filePath) {
  try {
    return readFileSync(filePath, 'utf-8').trim();
  } catch (e) {
    return null;
  }
}

/**
 * Convert a single WebUI sample to ground truth format
 */
async function convertSample(sampleDir) {
  const sampleId = sampleDir.split('/').pop();
  const files = readdirSync(sampleDir);
  
  // Find key files - collect ALL viewports/devices
  const screenshots = files.filter(f => f.includes('screenshot') && f.endsWith('.webp'));
  const html = files.find(f => f.includes('html') && f.endsWith('.html'));
  const urlFile = files.find(f => f.includes('url') && f.endsWith('.txt'));
  const axtrees = files.filter(f => f.includes('axtree') && f.endsWith('.json.gz'));
  const boxes = files.filter(f => f.includes('box') && !f.includes('bb') && f.endsWith('.json.gz'));
  const styles = files.filter(f => f.includes('style') && f.endsWith('.json.gz'));
  const links = files.find(f => f.includes('links') && f.endsWith('.json'));
  const classes = files.filter(f => f.includes('class') && f.endsWith('.json.gz'));
  const viewports = files.filter(f => f.includes('viewport') && f.endsWith('.json.gz'));
  
  // Primary screenshot (prefer default_1920-1080, fallback to first)
  const screenshot = screenshots.find(f => f.includes('default_1920-1080')) || screenshots[0];
  
  if (!screenshot) {
    return null; // Skip samples without screenshots
  }
  
  const screenshotPath = join(sampleDir, screenshot);
  const url = urlFile ? readText(join(sampleDir, urlFile)) : null;
  
  // Extract viewport from primary screenshot filename
  const viewportMatch = screenshot ? screenshot.match(/(\d+)[-x](\d+)/) : null;
  const viewport = viewportMatch ? {
    width: parseInt(viewportMatch[1]),
    height: parseInt(viewportMatch[2])
  } : null;
  
  // Load metadata
  const metadata = {
    sampleId,
    url,
    viewport,
    screenshot: screenshotPath,
    timestamp: parseInt(sampleId) || null,
    availableViewports: screenshots.length,
    availableDevices: new Set(screenshots.map(s => {
      if (s.includes('iPad')) return 'tablet';
      if (s.includes('iPhone')) return 'mobile';
      return 'desktop';
    })).size
  };
  
  // Load structured data if available - use primary/default viewport files
  const annotations = {};
  
  // Primary accessibility tree (prefer default_1920-1080)
  const primaryAxtree = axtrees.find(f => f.includes('default_1920-1080')) || axtrees[0];
  if (primaryAxtree) {
    const axtreeData = await readGzippedJson(join(sampleDir, primaryAxtree));
    if (axtreeData) annotations.accessibilityTree = axtreeData;
  }
  
  // Primary bounding boxes
  const primaryBox = boxes.find(f => f.includes('default_1920-1080')) || boxes[0];
  if (primaryBox) {
    const boxData = await readGzippedJson(join(sampleDir, primaryBox));
    if (boxData) annotations.boundingBoxes = boxData;
  }
  
  // Primary styles
  const primaryStyle = styles.find(f => f.includes('default_1920-1080')) || styles[0];
  if (primaryStyle) {
    const styleData = await readGzippedJson(join(sampleDir, primaryStyle));
    if (styleData) annotations.styles = styleData;
  }
  
  // Element classes (if available)
  const primaryClass = classes.find(f => f.includes('default_1920-1080')) || classes[0];
  if (primaryClass) {
    const classData = await readGzippedJson(join(sampleDir, primaryClass));
    if (classData) annotations.classes = classData;
  }
  
  // Viewport metadata
  const primaryViewport = viewports.find(f => f.includes('default_1920-1080')) || viewports[0];
  if (primaryViewport) {
    const viewportData = await readGzippedJson(join(sampleDir, primaryViewport));
    if (viewportData) annotations.viewportMetadata = viewportData;
  }
  
  if (links) {
    const linksData = readJson(join(sampleDir, links));
    if (linksData) annotations.links = linksData;
  }
  
  if (html) {
    const htmlPath = join(sampleDir, html);
    if (existsSync(htmlPath)) {
      annotations.html = readFileSync(htmlPath, 'utf-8').substring(0, 50000); // Limit size
    }
  }
  
  // Store all available viewports for multi-viewport evaluation
  annotations.availableViewports = screenshots.map(s => {
    const match = s.match(/(\d+)[-x](\d+)/);
    const deviceMatch = s.match(/(iPad-Pro|iPhone-13 Pro|default)/i);
    return {
      device: deviceMatch ? deviceMatch[1] : 'default',
      viewport: match ? { width: parseInt(match[1]), height: parseInt(match[2]) } : null,
      screenshot: join(sampleDir, s)
    };
  });
  
  return {
    id: sampleId,
    url,
    screenshot: screenshotPath,
    viewport,
    metadata,
    annotations: Object.keys(annotations).length > 0 ? annotations : undefined,
    // Ground truth fields for evaluation
    groundTruth: {
      hasScreenshot: true,
      hasAccessibilityTree: !!annotations.accessibilityTree,
      hasBoundingBoxes: !!annotations.boundingBoxes,
      hasStyles: !!annotations.styles,
      hasHtml: !!annotations.html,
      hasClasses: !!annotations.classes,
      hasViewportMetadata: !!annotations.viewportMetadata,
      multiViewport: screenshots.length > 1,
      viewportCount: screenshots.length
    }
  };
}

/**
 * Main conversion function
 */
async function convertWebUIDataset(options = {}) {
  const { limit = null, outputFile = OUTPUT_FILE } = options;
  
  console.log('🔄 Converting WebUI Dataset to Ground Truth Format\n');
  console.log(`📁 Source: ${WEBUI_DATASET_DIR}`);
  console.log(`📄 Output: ${outputFile}\n`);
  
  if (!existsSync(WEBUI_DATASET_DIR)) {
    console.error(`❌ Dataset directory not found: ${WEBUI_DATASET_DIR}`);
    process.exit(1);
  }
  
  // Get all sample directories
  const sampleDirs = readdirSync(WEBUI_DATASET_DIR)
    .filter(item => {
      const itemPath = join(WEBUI_DATASET_DIR, item);
      return statSync(itemPath).isDirectory();
    })
    .map(item => join(WEBUI_DATASET_DIR, item));
  
  const totalSamples = limit ? Math.min(limit, sampleDirs.length) : sampleDirs.length;
  console.log(`📊 Found ${sampleDirs.length} samples, processing ${totalSamples}...\n`);
  
  const convertedSamples = [];
  let processed = 0;
  let skipped = 0;
  
  for (const sampleDir of sampleDirs.slice(0, totalSamples)) {
    try {
      const sample = await convertSample(sampleDir);
      if (sample) {
        convertedSamples.push(sample);
        processed++;
        if (processed % 100 === 0) {
          console.log(`   Processed ${processed}/${totalSamples} samples...`);
        }
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`   ⚠️  Error processing ${sampleDir}: ${error.message}`);
      skipped++;
    }
  }
  
  const dataset = {
    name: 'WebUI Ground Truth Dataset',
    source: 'WebUI Dataset (webui-7k)',
    version: '1.0.0',
    created: new Date().toISOString(),
    totalSamples: convertedSamples.length,
    samples: convertedSamples
  };
  
  // Write output
  const output = JSON.stringify(dataset, null, 2);
  writeFileSync(outputFile, output);
  
  console.log(`\n✅ Conversion completed!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Output: ${outputFile}`);
  console.log(`   Size: ${(output.length / 1024 / 1024).toFixed(2)} MB`);
  
  return dataset;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : null;
  convertWebUIDataset({ limit }).catch(console.error);
}

export { convertWebUIDataset, convertSample };

