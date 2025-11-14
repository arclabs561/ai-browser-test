#!/usr/bin/env node
/**
 * Parse WCAG Test Cases from HTML
 * 
 * Extracts test case information from the downloaded WCAG HTML page.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const WCAG_HTML_FILE = join(process.cwd(), 'evaluation', 'datasets', 'human-annotated', 'wcag-test-cases', 'testcases.json');
const OUTPUT_FILE = join(process.cwd(), 'evaluation', 'datasets', 'wcag-ground-truth.json');

/**
 * Parse WCAG test cases from HTML
 */
function parseWCAGTestCases() {
  console.log('🔄 Parsing WCAG Test Cases\n');
  
  if (!existsSync(WCAG_HTML_FILE)) {
    console.error(`❌ WCAG HTML file not found: ${WCAG_HTML_FILE}`);
    process.exit(1);
  }
  
  const html = readFileSync(WCAG_HTML_FILE, 'utf-8');
  
  // The file is actually HTML, not JSON
  // Extract test case links and information
  const testCases = [];
  
  // Look for test case links (pattern: /WAI/standards-guidelines/act/rules/...)
  const testCaseLinkPattern = /href="(\/WAI\/standards-guidelines\/act\/rules\/[^"]+)"/g;
  const rulePattern = /<a[^>]*href="(\/WAI\/standards-guidelines\/act\/rules\/[^"]+)"[^>]*>([^<]+)<\/a>/g;
  
  let match;
  const seen = new Set();
  
  while ((match = rulePattern.exec(html)) !== null) {
    const url = match[1];
    const name = match[2].trim();
    
    if (!seen.has(url) && name && name.length > 0) {
      seen.add(url);
      testCases.push({
        id: `wcag-${testCases.length + 1}`,
        name,
        url: `https://www.w3.org${url}`,
        source: 'W3C WCAG ACT Rules',
        type: 'accessibility_test_case'
      });
    }
  }
  
  // Also look for test case references in the page
  const testCaseRefPattern = /test[_\s-]?case[s]?/gi;
  const hasTestCases = testCaseRefPattern.test(html);
  
  const dataset = {
    name: 'WCAG Test Cases',
    source: 'W3C WCAG ACT Rules',
    version: '1.0.0',
    created: new Date().toISOString(),
    description: 'WCAG accessibility test cases extracted from W3C ACT Rules',
    totalTestCases: testCases.length,
    testCases,
    note: hasTestCases 
      ? 'Test cases extracted from W3C page. Individual test case details may require additional parsing.'
      : 'Limited test case information extracted. May need to visit individual rule pages for full test cases.'
  };
  
  // Write output
  writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
  
  console.log(`✅ Parsing completed!`);
  console.log(`   Found ${testCases.length} test case references`);
  console.log(`   Output: ${OUTPUT_FILE}`);
  
  return dataset;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  parseWCAGTestCases();
}

export { parseWCAGTestCases };

