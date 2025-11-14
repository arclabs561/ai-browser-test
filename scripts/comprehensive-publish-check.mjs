#!/usr/bin/env node
/**
 * Comprehensive Publish Check
 * 
 * Thoroughly validates package before publishing:
 * - Package.json validation
 * - File inclusion checks
 * - Secret detection
 * - Export validation
 * - Test status
 * - Documentation checks
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

/**
 * Check package.json
 */
function checkPackageJson() {
  console.log('📦 Checking package.json...\n');
  
  const pkgPath = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  
  const checks = {
    name: pkg.name === 'ai-visual-test',
    version: /^\d+\.\d+\.\d+$/.test(pkg.version),
    description: typeof pkg.description === 'string' && pkg.description.length > 0,
    main: existsSync(join(ROOT, pkg.main)),
    exports: pkg.exports && Object.keys(pkg.exports).length >= 8,
    files: Array.isArray(pkg.files) && pkg.files.length > 0,
    repository: pkg.repository?.url?.includes('ai-visual-test'),
    keywords: Array.isArray(pkg.keywords) && pkg.keywords.length > 0,
    license: pkg.license === 'MIT',
  };
  
  console.log(`   ${checks.name ? '✅' : '❌'} Name: ${pkg.name}`);
  console.log(`   ${checks.version ? '✅' : '❌'} Version: ${pkg.version}`);
  console.log(`   ${checks.description ? '✅' : '❌'} Description: ${pkg.description.substring(0, 50)}...`);
  console.log(`   ${checks.main ? '✅' : '❌'} Main entry: ${pkg.main}`);
  console.log(`   ${checks.exports ? '✅' : '❌'} Exports: ${Object.keys(pkg.exports || {}).length} paths`);
  console.log(`   ${checks.files ? '✅' : '❌'} Files field: ${pkg.files?.length || 0} patterns`);
  console.log(`   ${checks.repository ? '✅' : '❌'} Repository: ${pkg.repository?.url || 'missing'}`);
  console.log(`   ${checks.keywords ? '✅' : '❌'} Keywords: ${pkg.keywords?.length || 0}`);
  console.log(`   ${checks.license ? '✅' : '❌'} License: ${pkg.license}\n`);
  
  return Object.values(checks).every(v => v);
}

/**
 * Check exports
 */
function checkExports() {
  console.log('🔍 Checking exports...\n');
  
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  const exports = pkg.exports || {};
  
  let allValid = true;
  for (const [path, filePath] of Object.entries(exports)) {
    const fullPath = join(ROOT, filePath);
    const exists = existsSync(fullPath);
    console.log(`   ${exists ? '✅' : '❌'} ${path} -> ${filePath}`);
    if (!exists) allValid = false;
  }
  console.log();
  
  return allValid;
}

/**
 * Check files field
 */
function checkFilesField() {
  console.log('📄 Checking files field...\n');
  
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  const files = pkg.files || [];
  
  const requiredFiles = [
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'index.d.ts',
  ];
  
  let allFound = true;
  for (const file of requiredFiles) {
    const found = files.some(pattern => {
      if (pattern === file) return true;
      if (pattern.includes('**')) {
        const base = pattern.split('**')[0];
        return file.startsWith(base);
      }
      return false;
    });
    console.log(`   ${found ? '✅' : '❌'} ${file}`);
    if (!found) allFound = false;
  }
  console.log();
  
  return allFound;
}

/**
 * Check for secrets
 */
function checkSecrets() {
  console.log('🔐 Checking for secrets...\n');
  
  try {
    execSync('npm run check:secrets', { stdio: 'pipe', cwd: ROOT });
    console.log('   ✅ No secrets detected\n');
    return true;
  } catch (error) {
    console.log('   ❌ Secrets check failed\n');
    return false;
  }
}

/**
 * Check tests
 */
function checkTests() {
  console.log('🧪 Checking tests...\n');
  
  try {
    const output = execSync('npm test 2>&1', { encoding: 'utf-8', cwd: ROOT, stdio: 'pipe' });
    const passed = output.includes('pass') && !output.includes('fail');
    const match = output.match(/(\d+)\s+pass/);
    const passCount = match ? parseInt(match[1]) : 0;
    
    console.log(`   ${passed ? '✅' : '❌'} Tests: ${passCount} passing`);
    console.log();
    return passed;
  } catch (error) {
    console.log('   ❌ Tests failed\n');
    return false;
  }
}

/**
 * Check npm pack
 */
function checkNpmPack() {
  console.log('📦 Checking npm pack...\n');
  
  try {
    const output = execSync('npm pack --dry-run 2>&1', { encoding: 'utf-8', cwd: ROOT });
    
    const sizeMatch = output.match(/package size: ([\d.]+ \w+)/);
    const filesMatch = output.match(/total files: (\d+)/);
    
    if (sizeMatch) console.log(`   ✅ Package size: ${sizeMatch[1]}`);
    if (filesMatch) console.log(`   ✅ Total files: ${filesMatch[1]}`);
    
    // Check for common issues
    const hasEnv = output.includes('.env');
    const hasSecrets = output.includes('secret') || output.includes('key');
    
    if (hasEnv) console.log('   ⚠️  .env files detected');
    if (hasSecrets) console.log('   ⚠️  Potential secrets detected');
    
    console.log();
    return true;
  } catch (error) {
    console.log('   ❌ npm pack check failed\n');
    return false;
  }
}

/**
 * Check git status
 */
function checkGitStatus() {
  console.log('🔍 Checking git status...\n');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: ROOT });
    const lines = status.trim().split('\n').filter(l => l);
    
    const unstaged = lines.filter(l => l.match(/^[^ ]/)).length;
    const staged = lines.filter(l => l.match(/^[AM]/)).length;
    
    console.log(`   📊 Unstaged: ${unstaged}`);
    console.log(`   📊 Staged: ${staged}`);
    
    if (unstaged > 0) {
      console.log('   ⚠️  Unstaged changes detected');
    }
    
    console.log();
    return true;
  } catch (error) {
    console.log('   ⚠️  Git check failed\n');
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Comprehensive Publish Check\n');
  console.log('=' .repeat(60));
  console.log();
  
  const results = {
    packageJson: checkPackageJson(),
    exports: checkExports(),
    files: checkFilesField(),
    secrets: checkSecrets(),
    tests: checkTests(),
    npmPack: checkNpmPack(),
    git: checkGitStatus(),
  };
  
  const allPassed = Object.values(results).every(v => v);
  
  console.log('=' .repeat(60));
  console.log('\n📊 Summary:\n');
  console.log(`   ${results.packageJson ? '✅' : '❌'} Package.json`);
  console.log(`   ${results.exports ? '✅' : '❌'} Exports`);
  console.log(`   ${results.files ? '✅' : '❌'} Files field`);
  console.log(`   ${results.secrets ? '✅' : '❌'} Secrets check`);
  console.log(`   ${results.tests ? '✅' : '❌'} Tests`);
  console.log(`   ${results.npmPack ? '✅' : '❌'} NPM pack`);
  console.log(`   ${results.git ? '✅' : '⚠️'} Git status\n`);
  
  if (allPassed) {
    console.log('✅ All checks passed! Ready to publish.\n');
    console.log('Next steps:');
    console.log('  1. Commit any pending changes');
    console.log('  2. Tag version: git tag v0.5.0');
    console.log('  3. Push tag: git push origin v0.5.0');
    console.log('  4. GitHub Actions will auto-publish\n');
    return 0;
  } else {
    console.log('❌ Some checks failed. Fix issues before publishing.\n');
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}

export { checkPackageJson, checkExports, checkFilesField, checkSecrets, checkTests, checkNpmPack };

