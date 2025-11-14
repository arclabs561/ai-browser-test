#!/usr/bin/env node
/**
 * Tidy Repository
 * 
 * Moves temporary documentation files to archive and cleans up git state.
 */

import { existsSync, mkdirSync, renameSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const ARCHIVE_DIR = join(ROOT, 'archive', 'docs-temp-' + new Date().toISOString().split('T')[0]);

// Files to archive (temporary docs in root)
const TEMP_DOCS = [
  'COMPLETE_IMPROVEMENTS_SUMMARY.md',
  'FINAL_IMPROVEMENTS_REPORT.md',
  'IMPROVEMENTS_SUMMARY.md',
  'QUICK_START_DATASETS.md',
  'REVIEW_TESTS_DATASETS_INTERFACES.md'
];

// Files to keep in root (important docs)
const KEEP_IN_ROOT = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'DEPLOYMENT.md',
  'SECURITY.md',
  'LICENSE'
];

/**
 * Archive temporary documentation
 */
function archiveTempDocs() {
  console.log('📦 Archiving temporary documentation...\n');
  
  if (!existsSync(ARCHIVE_DIR)) {
    mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
  
  let archived = 0;
  for (const doc of TEMP_DOCS) {
    const source = join(ROOT, doc);
    if (existsSync(source)) {
      const dest = join(ARCHIVE_DIR, doc);
      try {
        renameSync(source, dest);
        console.log(`   ✅ Archived: ${doc}`);
        archived++;
      } catch (error) {
        console.log(`   ⚠️  Failed to archive ${doc}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n📊 Archived ${archived} files to: ${ARCHIVE_DIR}\n`);
  return archived;
}

/**
 * Check git status
 */
function checkGitStatus() {
  console.log('🔍 Checking git status...\n');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    const lines = status.trim().split('\n').filter(l => l);
    
    const staged = lines.filter(l => l.startsWith('A ') || l.startsWith('M ')).length;
    const modified = lines.filter(l => l.startsWith(' M')).length;
    const untracked = lines.filter(l => l.startsWith('??')).length;
    
    console.log(`   📊 Staged: ${staged}`);
    console.log(`   📝 Modified: ${modified}`);
    console.log(`   📄 Untracked: ${untracked}`);
    console.log(`   📦 Total: ${lines.length} changes\n`);
    
    return { staged, modified, untracked, total: lines.length };
  } catch (error) {
    console.log(`   ⚠️  Error checking git status: ${error.message}\n`);
    return null;
  }
}

/**
 * Check npm publish readiness
 */
function checkNpmPublish() {
  console.log('📦 Checking npm publish readiness...\n');
  
  const checks = {
    version: false,
    files: false,
    secrets: false,
    exports: false
  };
  
  // Check version
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    checks.version = !!pkg.version;
    checks.exports = !!pkg.exports && Object.keys(pkg.exports).length > 0;
    checks.files = Array.isArray(pkg.files) && pkg.files.length > 0;
    
    console.log(`   ${checks.version ? '✅' : '❌'} Version: ${pkg.version || 'missing'}`);
    console.log(`   ${checks.exports ? '✅' : '❌'} Exports: ${Object.keys(pkg.exports || {}).length} paths`);
    console.log(`   ${checks.files ? '✅' : '❌'} Files: ${pkg.files?.length || 0} patterns`);
  } catch (error) {
    console.log(`   ❌ Error reading package.json: ${error.message}`);
  }
  
  // Check secrets
  try {
    execSync('npm run check:secrets', { stdio: 'pipe' });
    checks.secrets = true;
    console.log(`   ✅ Secrets: No secrets found`);
  } catch (error) {
    checks.secrets = false;
    console.log(`   ⚠️  Secrets: Check may have found issues`);
  }
  
  console.log();
  return checks;
}

/**
 * Check GitHub workflows
 */
function checkWorkflows() {
  console.log('🔍 Checking GitHub workflows...\n');
  
  const workflows = [
    '.github/workflows/test.yml',
    '.github/workflows/ci.yml',
    '.github/workflows/publish.yml',
    '.github/workflows/security.yml'
  ];
  
  let found = 0;
  for (const workflow of workflows) {
    const path = join(ROOT, workflow);
    if (existsSync(path)) {
      console.log(`   ✅ ${workflow}`);
      found++;
    } else {
      console.log(`   ❌ ${workflow} (missing)`);
    }
  }
  
  console.log(`\n📊 Found ${found}/${workflows.length} workflows\n`);
  return found === workflows.length;
}

/**
 * Main function
 */
function main() {
  console.log('🧹 Repository Tidy-Up\n');
  console.log('=' .repeat(50));
  console.log();
  
  // Archive temp docs
  const archived = archiveTempDocs();
  
  // Check git status
  const gitStatus = checkGitStatus();
  
  // Check npm publish
  const npmChecks = checkNpmPublish();
  
  // Check workflows
  const workflowsOk = checkWorkflows();
  
  // Summary
  console.log('=' .repeat(50));
  console.log('\n📊 Summary:\n');
  console.log(`   📦 Archived: ${archived} temporary docs`);
  console.log(`   📝 Git changes: ${gitStatus?.total || 0} files`);
  console.log(`   📦 NPM ready: ${Object.values(npmChecks).every(v => v) ? '✅' : '⚠️'}`);
  console.log(`   🔄 Workflows: ${workflowsOk ? '✅' : '⚠️'}\n`);
  
  if (archived > 0) {
    console.log('💡 Next steps:');
    console.log('   1. Review archived docs in:', ARCHIVE_DIR);
    console.log('   2. Stage important changes: git add <files>');
    console.log('   3. Commit: git commit -m "feat: add improvements"');
    console.log('   4. Push: git push\n');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { archiveTempDocs, checkGitStatus, checkNpmPublish, checkWorkflows };

