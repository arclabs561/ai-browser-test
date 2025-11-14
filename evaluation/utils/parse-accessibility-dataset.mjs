#!/usr/bin/env node
/**
 * Parse Accessibility Auditing Dataset
 * 
 * Parses the MDPI accessibility auditing dataset if available.
 * This dataset requires manual download from:
 * https://www.mdpi.com/2306-5729/10/9/149
 */

import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const DATASET_DIR = join(process.cwd(), 'evaluation', 'datasets', 'human-annotated', 'accessibility-auditing');
const OUTPUT_FILE = join(process.cwd(), 'evaluation', 'datasets', 'accessibility-ground-truth.json');

/**
 * Parse accessibility dataset
 */
async function parseAccessibilityDataset() {
  console.log('🔄 Parsing Accessibility Auditing Dataset\n');
  
  if (!existsSync(DATASET_DIR)) {
    console.log('   ⚠️  Dataset directory not found');
    console.log('   💡 Download dataset from: https://www.mdpi.com/2306-5729/10/9/149');
    console.log('   💡 Place files in:', DATASET_DIR);
    return null;
  }
  
  const files = readdirSync(DATASET_DIR, { withFileTypes: true });
  const dataFiles = files.filter(f => 
    !f.isDirectory() && 
    (f.name.endsWith('.json') || f.name.endsWith('.csv') || f.name.endsWith('.tsv'))
  );
  
  if (dataFiles.length === 0) {
    console.log('   ⚠️  No data files found in dataset directory');
    console.log('   💡 Expected JSON, CSV, or TSV files');
    return null;
  }
  
  console.log(`   📊 Found ${dataFiles.length} data files\n`);
  
  const samples = [];
  
  for (const file of dataFiles) {
    const filePath = join(DATASET_DIR, file.name);
    
    try {
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        
        // Handle different JSON structures
        if (Array.isArray(data)) {
          samples.push(...data.map((item, idx) => ({
            id: `acc-${file.name}-${idx}`,
            source: 'MDPI Accessibility Auditing',
            ...item
          })));
        } else if (data.samples || data.data) {
          const items = data.samples || data.data || [];
          samples.push(...items.map((item, idx) => ({
            id: `acc-${file.name}-${idx}`,
            source: 'MDPI Accessibility Auditing',
            ...item
          })));
        }
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        // Basic CSV/TSV parsing (can be enhanced)
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        const delimiter = file.name.endsWith('.csv') ? ',' : '\t';
        
        if (lines.length > 1) {
          const headers = lines[0].split(delimiter);
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter);
            const item = {};
            headers.forEach((header, idx) => {
              item[header.trim()] = values[idx]?.trim() || '';
            });
            samples.push({
              id: `acc-${file.name}-${i}`,
              source: 'MDPI Accessibility Auditing',
              ...item
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Error parsing ${file.name}: ${error.message}`);
    }
  }
  
  if (samples.length === 0) {
    console.log('   ⚠️  No samples extracted from dataset files');
    return null;
  }
  
  const dataset = {
    name: 'Accessibility Auditing Dataset',
    source: 'MDPI',
    version: '1.0.0',
    created: new Date().toISOString(),
    description: 'Accessibility auditing dataset with WCAG compliance annotations',
    totalSamples: samples.length,
    samples
  };
  
  // Write output
  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
  
  console.log(`✅ Parsing completed!`);
  console.log(`   Found ${samples.length} samples`);
  console.log(`   Output: ${OUTPUT_FILE}\n`);
  
  return dataset;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  parseAccessibilityDataset().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { parseAccessibilityDataset };

