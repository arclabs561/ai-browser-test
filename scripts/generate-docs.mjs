#!/usr/bin/env node
/**
 * Generate documentation from TSDoc/JSDoc comments
 * 
 * Auto-generates API documentation from source code comments using TypeDoc.
 * TypeDoc is the modern standard for TypeScript/JavaScript ES modules (2025).
 * 
 * Uses TypeDoc which:
 * - Supports ES modules natively
 * - Works with JSDoc comments (backward compatible)
 * - Supports TSDoc standard (Microsoft-backed)
 * - Generates modern, type-aware documentation
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = join(process.cwd(), 'docs-generated');
const DOCS_SITE_DIR = join(process.cwd(), 'docs-site');

console.log('📚 Generating documentation from TSDoc/JSDoc comments...\n');
console.log('Using TypeDoc (modern standard for ES modules, 2025)\n');

try {
  // Check if typedoc is installed
  try {
    execSync('npx typedoc --version', { stdio: 'ignore' });
  } catch {
    console.log('📦 Installing TypeDoc...');
    execSync('npm install --save-dev typedoc', { stdio: 'inherit' });
  }

  // Generate docs with TypeDoc
  console.log('🔨 Generating API documentation with TypeDoc...');
  execSync('npx typedoc', { stdio: 'inherit' });

  // Generate simplified API reference for docs site
  console.log('\n📄 Generating simplified API reference...');
  generateSimplifiedAPI();

  console.log('\n✅ Documentation generated!');
  console.log(`   📁 Full docs: ${DOCS_DIR}`);
  console.log(`   🌐 Docs site: ${DOCS_SITE_DIR}/api-reference.html`);
  
} catch (error) {
  console.error('❌ Error generating docs:', error.message);
  process.exit(1);
}

/**
 * Generate simplified API reference from generated docs
 */
function generateSimplifiedAPI() {
  // Read the generated index.html to extract API info
  const indexPath = join(DOCS_DIR, 'index.html');
  
  if (!existsSync(indexPath)) {
    console.warn('⚠️  Generated docs not found, skipping simplified API');
    return;
  }

  // Create a simple API reference page
  const apiRefHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Reference - ai-visual-test</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .note {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
    }
    iframe {
      width: 100%;
      height: 80vh;
      border: none;
      border-radius: 8px;
      background: white;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>API Reference</h1>
    <p>Auto-generated from JSDoc comments in source code</p>
  </div>
  
  <div class="note">
    <strong>📚 Full Documentation:</strong> See <a href="../docs-generated/index.html" target="_blank">complete JSDoc documentation</a> for detailed API reference.
  </div>
  
  <iframe src="../docs-generated/index.html" title="API Reference"></iframe>
</body>
</html>`;

  writeFileSync(join(DOCS_SITE_DIR, 'api-reference.html'), apiRefHTML);
}

