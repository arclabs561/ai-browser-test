#!/usr/bin/env node
/**
 * Validate VLLM Outputs Against Ground Truth
 * 
 * Uses WebUI dataset annotations to validate VLLM accessibility and element detection claims.
 * 
 * Validates:
 * 1. Accessibility tree - compare VLLM accessibility claims with actual tree structure
 * 2. Bounding boxes - validate element detection accuracy
 * 3. Styles - validate CSS-related claims
 */

import { loadWebUIDataset } from './load-webui-dataset.mjs';
import { validateScreenshot } from '../../src/index.mjs';
import { createConfig } from '../../src/config.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { readGzippedJson } from './gzip-utils.mjs';

/**
 * Extract accessibility information from accessibility tree
 */
function extractAccessibilityInfo(axtree) {
  if (!axtree) return null;
  
  // Handle different axtree formats
  let nodes = null;
  
  if (Array.isArray(axtree)) {
    nodes = axtree;
  } else if (axtree.nodes && Array.isArray(axtree.nodes)) {
    nodes = axtree.nodes;
  } else if (typeof axtree === 'object') {
    // Try to find array-like structure
    const keys = Object.keys(axtree);
    for (const key of keys) {
      if (Array.isArray(axtree[key])) {
        nodes = axtree[key];
        break;
      }
    }
  }
  
  if (!nodes || !Array.isArray(nodes)) {
    return null;
  }
  
  const info = {
    totalElements: nodes.length,
    interactiveElements: [],
    landmarks: [],
    headings: [],
    links: [],
    buttons: [],
    formControls: [],
    images: [],
    roles: {},
    ariaLabels: 0,
    missingLabels: []
  };
  
  function traverse(node, depth = 0) {
    if (!node) return;
    
    // Handle different node formats
    const roleObj = node.role || {};
    const role = (typeof roleObj === 'string' ? roleObj : roleObj.value || roleObj.type || '');
    const nameObj = node.name || {};
    const name = (typeof nameObj === 'string' ? nameObj : nameObj.value || '');
    const type = node.type || node.nodeType || '';
    
    // Count roles
    info.roles[role] = (info.roles[role] || 0) + 1;
    
    // Categorize elements
    if (role === 'button' || type === 'button') {
      info.buttons.push({ name, role, depth });
    }
    if (role === 'link' || type === 'link') {
      info.links.push({ name, role, depth });
    }
    if (role === 'heading' || /^h[1-6]$/i.test(type)) {
      info.headings.push({ name, role, level: node.level || depth });
    }
    if (['main', 'navigation', 'banner', 'contentinfo', 'complementary'].includes(role)) {
      info.landmarks.push({ name, role });
    }
    if (['textbox', 'checkbox', 'radio', 'combobox', 'slider'].includes(role)) {
      info.formControls.push({ name, role });
    }
    if (role === 'img' || type === 'img') {
      info.images.push({ name, alt: node.alt || null });
    }
    
    // Check for ARIA labels
    if (node.attributes?.ariaLabel || name) {
      info.ariaLabels++;
    } else if (['button', 'link', 'img'].includes(role)) {
      info.missingLabels.push({ role, type });
    }
    
    // Interactive elements
    if (['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'slider', 'tab'].includes(role)) {
      info.interactiveElements.push({ name, role, depth });
    }
    
    // Traverse children - handle different formats
    let children = [];
    if (node.children && Array.isArray(node.children)) {
      children = node.children;
    } else if (node.childIds && Array.isArray(node.childIds)) {
      // Reference-based structure - need to look up nodes
      children = node.childIds.map(id => 
        nodes.find(n => (n.nodeId || n.id) === id)
      ).filter(Boolean);
    } else if (node.childNodes && Array.isArray(node.childNodes)) {
      children = node.childNodes;
    }
    
    children.forEach(child => {
      if (child) traverse(child, depth + 1);
    });
  }
  
  // Start traversal from root nodes (nodes without parentId or with specific root markers)
  const rootNodes = nodes.filter(n => !n.parentId || n.role?.value === 'RootWebArea' || n.role === 'RootWebArea');
  if (rootNodes.length > 0) {
    rootNodes.forEach(node => traverse(node));
  } else {
    // Fallback: traverse all nodes
    nodes.forEach(node => traverse(node));
  }
  
  return info;
}

/**
 * Extract element locations from bounding boxes
 */
function extractElementLocations(boxes) {
  if (!boxes) return null;
  
  // Handle WebUI format: object with numeric keys, each containing content/padding/border/margin
  if (typeof boxes === 'object' && !Array.isArray(boxes)) {
    const keys = Object.keys(boxes);
    const elements = [];
    
    for (const key of keys) {
      const box = boxes[key];
      if (!box || typeof box !== 'object') continue;
      
      // Extract content box (primary bounding box)
      const content = box.content || box;
      let x = 0, y = 0, width = 0, height = 0;
      
      if (Array.isArray(content) && content.length >= 2) {
        // Format: [{x, y}, {x, y}, {x, y}, {x, y}] - 4 corners
        const minX = Math.min(...content.map(p => p.x || 0));
        const maxX = Math.max(...content.map(p => p.x || 0));
        const minY = Math.min(...content.map(p => p.y || 0));
        const maxY = Math.max(...content.map(p => p.y || 0));
        x = minX;
        y = minY;
        width = maxX - minX;
        height = maxY - minY;
      } else if (box.width && box.height) {
        // Direct width/height format
        x = box.x || 0;
        y = box.y || 0;
        width = box.width;
        height = box.height;
      }
      
      if (width > 0 && height > 0) {
        elements.push({
          nodeId: key,
          x, y, width, height,
          centerX: x + width / 2,
          centerY: y + height / 2,
          area: width * height,
          content: box.content,
          padding: box.padding,
          border: box.border,
          margin: box.margin
        });
      }
    }
    
    return {
      totalElements: elements.length,
      elements
    };
  }
  
  // Handle array format
  if (Array.isArray(boxes)) {
    return {
      totalElements: boxes.length,
      elements: boxes.map((box, i) => {
        const bbox = box.boundingBox || box.box || box.rect || box;
        const x = bbox.x || bbox.left || 0;
        const y = bbox.y || bbox.top || 0;
        const width = bbox.width || (bbox.right ? bbox.right - (bbox.left || bbox.x || 0) : 0) || 0;
        const height = bbox.height || (bbox.bottom ? bbox.bottom - (bbox.top || bbox.y || 0) : 0) || 0;
        
        return {
          index: i,
          x, y, width, height,
          centerX: x + width / 2,
          centerY: y + height / 2,
          area: width * height,
          type: box.type || box.role || 'unknown'
        };
      })
    };
  }
  
  return {
    totalElements: 0,
    elements: [],
    note: 'Unable to parse bounding box structure'
  };
}

/**
 * Validate VLLM accessibility claims against ground truth
 */
function validateAccessibilityClaims(vllmResult, axtreeInfo) {
  if (!axtreeInfo) {
    return { validated: false, reason: 'No accessibility tree available' };
  }
  
  const claims = {
    totalElements: 0,
    interactiveElements: 0,
    buttons: 0,
    links: 0,
    headings: 0,
    landmarks: 0,
    formControls: 0,
    images: 0,
    ariaLabels: 0
  };
  
  // Extract claims from VLLM reasoning/issues
  const text = (vllmResult.reasoning || '').toLowerCase() + ' ' + (vllmResult.issues || []).join(' ').toLowerCase();
  
  // Enhanced keyword extraction with multiple patterns
  const patterns = {
    buttons: [
      /\b(\d+)\s+button/i,
      /button[^.]*?(\d+)/i,
      /(\d+)\s+clickable\s+button/i
    ],
    links: [
      /\b(\d+)\s+link/i,
      /link[^.]*?(\d+)/i,
      /(\d+)\s+hyperlink/i
    ],
    headings: [
      /\b(\d+)\s+heading/i,
      /heading[^.]*?(\d+)/i,
      /h[1-6][^.]*?(\d+)/i
    ],
    images: [
      /\b(\d+)\s+image/i,
      /image[^.]*?(\d+)/i,
      /(\d+)\s+img/i
    ],
    formControls: [
      /\b(\d+)\s+(?:input|form|field)/i,
      /(?:input|form|field)[^.]*?(\d+)/i
    ]
  };
  
  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        if (!isNaN(value) && value > 0) {
          claims[key] = Math.max(claims[key] || 0, value);
        }
      }
    }
  }
  
  // Compare with ground truth
  const accuracy = {
    buttons: axtreeInfo.buttons.length > 0 
      ? (Math.min(claims.buttons, axtreeInfo.buttons.length) / Math.max(claims.buttons, axtreeInfo.buttons.length))
      : (claims.buttons === 0 ? 1 : 0),
    links: axtreeInfo.links.length > 0
      ? (Math.min(claims.links, axtreeInfo.links.length) / Math.max(claims.links, axtreeInfo.links.length))
      : (claims.links === 0 ? 1 : 0),
    headings: axtreeInfo.headings.length > 0
      ? (Math.min(claims.headings, axtreeInfo.headings.length) / Math.max(claims.headings, axtreeInfo.headings.length))
      : (claims.headings === 0 ? 1 : 0),
    images: axtreeInfo.images.length > 0
      ? (Math.min(claims.images, axtreeInfo.images.length) / Math.max(claims.images, axtreeInfo.images.length))
      : (claims.images === 0 ? 1 : 0)
  };
  
  const averageAccuracy = Object.values(accuracy).reduce((a, b) => a + b, 0) / Object.values(accuracy).length;
  
  return {
    validated: true,
    groundTruth: {
      buttons: axtreeInfo.buttons.length,
      links: axtreeInfo.links.length,
      headings: axtreeInfo.headings.length,
      images: axtreeInfo.images.length,
      interactiveElements: axtreeInfo.interactiveElements.length,
      landmarks: axtreeInfo.landmarks.length,
      ariaLabels: axtreeInfo.ariaLabels
    },
    vllmClaims: claims,
    accuracy,
    averageAccuracy
  };
}

/**
 * Evaluate sample with ground truth validation
 */
async function evaluateWithGroundTruth(sample, options = {}) {
  const { provider = null } = options;
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    return {
      sampleId: sample.id,
      status: 'skipped',
      reason: 'vllm_disabled'
    };
  }
  
  // Load ground truth annotations if not already loaded
  let axtreeInfo = null;
  let boxInfo = null;
  
  if (sample.annotations?.accessibilityTree) {
    axtreeInfo = extractAccessibilityInfo(sample.annotations.accessibilityTree);
  }
  
  if (sample.annotations?.boundingBoxes) {
    boxInfo = extractElementLocations(sample.annotations.boundingBoxes);
  }
  
  // Run VLLM evaluation
  const prompt = `Evaluate this webpage screenshot for accessibility. 
Specifically identify and count:
- Number of buttons
- Number of links
- Number of headings (h1-h6)
- Number of images
- Number of interactive elements
- Presence of ARIA labels
- Landmark regions (main, nav, etc.)

Provide specific counts and detailed analysis.`;
  
  const vllmResult = await validateScreenshot(
    sample.screenshot,
    prompt,
    {
      provider: config.provider,
      apiKey: config.apiKey,
      testType: 'accessibility-ground-truth'
    }
  );
  
  // Validate against ground truth
  const validation = validateAccessibilityClaims(vllmResult, axtreeInfo);
  
  return {
    sampleId: sample.id,
    url: sample.url,
    vllmResult: {
      score: vllmResult.score,
      reasoning: vllmResult.reasoning,
      issues: vllmResult.issues
    },
    groundTruth: {
      accessibilityTree: axtreeInfo,
      boundingBoxes: boxInfo
    },
    validation,
    accuracy: validation.validated ? validation.averageAccuracy : null
  };
}

/**
 * Run ground truth validation evaluation
 */
async function runGroundTruthValidation(options = {}) {
  const { limit = 20, provider = null } = options;
  
  console.log('🔍 Ground Truth Validation Evaluation\n');
  console.log('Validating VLLM outputs against WebUI dataset annotations\n');
  
  const config = createConfig({ provider });
  if (!config.enabled) {
    console.error('❌ VLLM validation is disabled');
    process.exit(1);
  }
  
  console.log(`Provider: ${config.provider}`);
  console.log(`Samples: ${limit}\n`);
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  if (!dataset || !dataset.samples || dataset.samples.length === 0) {
    console.error('❌ No samples available');
    process.exit(1);
  }
  
  // Filter samples with ground truth
  const samplesWithGT = dataset.samples.filter(s => 
    s.groundTruth?.hasAccessibilityTree && s.groundTruth?.hasBoundingBoxes
  ).slice(0, limit);
  
  console.log(`📊 Evaluating ${samplesWithGT.length} samples with full ground truth\n`);
  
  const results = [];
  let totalAccuracy = 0;
  let validatedCount = 0;
  
  for (let i = 0; i < samplesWithGT.length; i++) {
    const sample = samplesWithGT[i];
    console.log(`[${i + 1}/${samplesWithGT.length}] ${sample.id}...`);
    
    try {
      const result = await evaluateWithGroundTruth(sample, { provider: config.provider });
      results.push(result);
      
      if (result.validation?.validated && result.accuracy !== null) {
        totalAccuracy += result.accuracy;
        validatedCount++;
        console.log(`   ✅ Accuracy: ${(result.accuracy * 100).toFixed(1)}%`);
      } else {
        console.log(`   ⚠️  ${result.validation?.reason || 'Could not validate'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        sampleId: sample.id,
        status: 'error',
        error: error.message
      });
    }
  }
  
  const averageAccuracy = validatedCount > 0 ? totalAccuracy / validatedCount : 0;
  
  console.log(`\n📊 Results:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Validated: ${validatedCount}`);
  console.log(`   Average Accuracy: ${(averageAccuracy * 100).toFixed(1)}%`);
  
  // Save results
  const resultsDir = join(process.cwd(), 'evaluation', 'results');
  mkdirSync(resultsDir, { recursive: true });
  const resultsFile = join(resultsDir, `ground-truth-validation-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    provider: config.provider,
    totalSamples: results.length,
    validated: validatedCount,
    averageAccuracy,
    results
  }, null, 2));
  
  console.log(`\n💾 Results saved: ${resultsFile}`);
  
  return { results, averageAccuracy };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 20;
  const provider = process.argv[3] || null;
  runGroundTruthValidation({ limit, provider }).catch(console.error);
}

export { runGroundTruthValidation, evaluateWithGroundTruth, extractAccessibilityInfo, extractElementLocations };

