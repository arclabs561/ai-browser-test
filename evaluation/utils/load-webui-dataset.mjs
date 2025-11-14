#!/usr/bin/env node
/**
 * Load WebUI Dataset for Evaluation
 * 
 * Loads converted WebUI ground truth dataset or converts on-the-fly.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { convertWebUIDataset } from './convert-webui-dataset.mjs';

const GROUND_TRUTH_FILE = join(process.cwd(), 'evaluation', 'datasets', 'webui-ground-truth.json');
const CACHE_FILE = join(process.cwd(), 'evaluation', 'datasets', '.webui-cache.json');

/**
 * Load WebUI dataset with caching
 */
export async function loadWebUIDataset(options = {}) {
  const { limit = null, cache = true, forceConvert = false } = options;
  
  // Check cache first
  if (cache && existsSync(CACHE_FILE) && !forceConvert) {
    try {
      const cached = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
      if (cached.samples && cached.samples.length > 0) {
        console.log(`📦 Loaded ${cached.samples.length} samples from cache`);
        if (limit) {
          return {
            ...cached,
            samples: cached.samples.slice(0, limit)
          };
        }
        return cached;
      }
    } catch (e) {
      // Cache invalid, continue
    }
  }
  
  // Check for ground truth file
  if (existsSync(GROUND_TRUTH_FILE) && !forceConvert) {
    try {
      const dataset = JSON.parse(readFileSync(GROUND_TRUTH_FILE, 'utf-8'));
      console.log(`📦 Loaded ${dataset.samples.length} samples from ground truth file`);
      
      // Update cache
      if (cache) {
        mkdirSync(dirname(CACHE_FILE), { recursive: true });
        writeFileSync(CACHE_FILE, JSON.stringify(dataset, null, 2));
      }
      
      if (limit) {
        return {
          ...dataset,
          samples: dataset.samples.slice(0, limit)
        };
      }
      return dataset;
    } catch (e) {
      console.log(`⚠️  Error loading ground truth file: ${e.message}`);
    }
  }
  
  // Convert on-the-fly
  console.log('🔄 Converting WebUI dataset...');
  const dataset = await convertWebUIDataset({ limit });
  
  // Save cache
  if (cache) {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(dataset, null, 2));
  }
  
  return dataset;
}

/**
 * Get sample by ID
 */
export function getWebUISample(dataset, sampleId) {
  return dataset.samples.find(s => s.id === sampleId);
}

/**
 * Get random samples
 */
export function getRandomWebUISamples(dataset, count = 10) {
  const shuffled = [...dataset.samples].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Filter samples by criteria
 */
export function filterWebUISamples(dataset, criteria = {}) {
  let filtered = [...dataset.samples];
  
  if (criteria.hasScreenshot) {
    filtered = filtered.filter(s => s.groundTruth?.hasScreenshot);
  }
  
  if (criteria.hasAccessibilityTree) {
    filtered = filtered.filter(s => s.groundTruth?.hasAccessibilityTree);
  }
  
  if (criteria.hasBoundingBoxes) {
    filtered = filtered.filter(s => s.groundTruth?.hasBoundingBoxes);
  }
  
  if (criteria.viewport) {
    filtered = filtered.filter(s => {
      if (!s.viewport) return false;
      if (criteria.viewport.width) {
        if (s.viewport.width !== criteria.viewport.width) return false;
      }
      if (criteria.viewport.height) {
        if (s.viewport.height !== criteria.viewport.height) return false;
      }
      return true;
    });
  }
  
  if (criteria.urlPattern) {
    const pattern = new RegExp(criteria.urlPattern);
    filtered = filtered.filter(s => s.url && pattern.test(s.url));
  }
  
  return filtered;
}

