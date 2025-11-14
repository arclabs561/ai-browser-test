#!/usr/bin/env node
/**
 * Create Natural Language Specs from WebUI Dataset
 * 
 * Generates natural language test specifications from WebUI dataset samples.
 * Useful for creating test cases based on real web pages.
 */

import { loadWebUIDataset, getRandomWebUISamples } from './load-webui-dataset.mjs';
import { createSpecFromTemplate, TEMPLATES } from '../../src/spec-templates.mjs';

/**
 * Generate spec from WebUI sample
 */
function generateSpecFromSample(sample) {
  const url = sample.url || 'the webpage';
  const viewport = sample.viewport 
    ? `${sample.viewport.width}x${sample.viewport.height}` 
    : '1280x720';
  
  // Determine spec type based on annotations
  let specType = 'browser_experience';
  if (sample.annotations?.accessibilityTree) {
    specType = 'accessibility';
  }
  
  const spec = createSpecFromTemplate(specType, {
    url: sample.url,
    viewport: viewport,
    description: `Test ${url} for visual quality and accessibility`
  });
  
  return {
    id: `webui-${sample.id}`,
    source: 'WebUI Dataset',
    sampleId: sample.id,
    url: sample.url,
    spec,
    metadata: {
      viewport: sample.viewport,
      hasAccessibilityTree: !!sample.annotations?.accessibilityTree,
      hasBoundingBoxes: !!sample.annotations?.boundingBoxes
    }
  };
}

/**
 * Generate multiple specs
 */
async function generateSpecs(options = {}) {
  const { limit = 10, outputFile = null } = options;
  
  console.log('📝 Generating Natural Language Specs from WebUI Dataset\n');
  
  const dataset = await loadWebUIDataset({ limit: null, cache: true });
  if (!dataset || !dataset.samples || dataset.samples.length === 0) {
    console.error('❌ No samples available. Run: node evaluation/utils/convert-webui-dataset.mjs first');
    process.exit(1);
  }
  
  const samples = getRandomWebUISamples(dataset, limit);
  console.log(`📊 Generating specs from ${samples.length} samples\n`);
  
  const specs = samples.map(sample => generateSpecFromSample(sample));
  
  const output = {
    name: 'WebUI-Generated Natural Language Specs',
    source: 'WebUI Dataset',
    created: new Date().toISOString(),
    totalSpecs: specs.length,
    specs
  };
  
  if (outputFile) {
    const { writeFileSync } = await import('fs');
    writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`✅ Specs saved to: ${outputFile}`);
  } else {
    console.log('\n📋 Generated Specs:\n');
    specs.forEach((spec, i) => {
      console.log(`${i + 1}. ${spec.id} (${spec.url || 'N/A'})`);
      console.log(`   ${spec.spec.split('\n').slice(0, 3).join('\n   ')}...\n`);
    });
  }
  
  return output;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 10;
  const outputFile = process.argv[3] || null;
  generateSpecs({ limit, outputFile }).catch(console.error);
}

export { generateSpecs, generateSpecFromSample };

