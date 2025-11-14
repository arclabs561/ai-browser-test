#!/usr/bin/env node
/**
 * Enhanced Garden - Comprehensive Repository Cleanup
 * 
 * Performs deep cleanup and quality checks:
 * - Archive temporary documentation
 * - Remove references to deprecated projects
 * - Check for code quality issues
 * - Verify git state
 * - Run hookwise checks
 * - Generate cleanup report
 */

import { existsSync, mkdirSync, renameSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = process.cwd();
const ARCHIVE_DIR = join(ROOT, 'archive', 'docs-temp-' + new Date().toISOString().split('T')[0]);

// Patterns for temporary docs
const TEMP_DOC_PATTERNS = [
  /^COMPLETION_/i,
  /^FINAL_/i,
  /^IMPROVEMENTS_/i,
  /^REVIEW_/i,
  /^GIT_/i,
  /^REPOSITORY_/i,
  /^COMMIT_/i,
  /_SUMMARY\.md$/i,
  /_REPORT\.md$/i,
  /_ANALYSIS\.md$/i,
  /_PLAN\.md$/i,
  /_STATUS\.md$/i,
];

// Essential files to keep
const ESSENTIAL_FILES = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'DEPLOYMENT.md',
  'SECURITY.md',
  'LICENSE',
  'openmemory.md',
];

// Deprecated project references to remove
const DEPRECATED_REFERENCES = [
  { pattern: /queeraoke/gi, replacement: 'interactive web applications' },
  { pattern: /https:\/\/queeraoke\.fyi/gi, replacement: 'web applications' },
  { pattern: /queeraoke-style/gi, replacement: 'interactive' },
  { pattern: /queeraoke's/gi, replacement: 'real-world' },
  { pattern: /from queeraoke/gi, replacement: 'from real-world usage' },
  { pattern: /Queeraoke/gi, replacement: 'Interactive applications' },
];

/**
 * Archive temporary documentation files
 */
function archiveTempDocs() {
  console.log('📦 Archiving temporary documentation...\n');
  
  if (!existsSync(ARCHIVE_DIR)) {
    mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
  
  const rootFiles = readdirSync(ROOT).filter(f => f.endsWith('.md'));
  let archived = 0;
  
  for (const file of rootFiles) {
    if (ESSENTIAL_FILES.includes(file)) {
      continue;
    }
    
    // Check if file matches temp patterns
    const shouldArchive = TEMP_DOC_PATTERNS.some(pattern => pattern.test(file));
    
    if (shouldArchive) {
      const source = join(ROOT, file);
      const dest = join(ARCHIVE_DIR, file);
      try {
        renameSync(source, dest);
        console.log(`   ✅ Archived: ${file}`);
        archived++;
      } catch (error) {
        console.log(`   ⚠️  Failed to archive ${file}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n📊 Archived ${archived} files to: ${ARCHIVE_DIR}\n`);
  return archived;
}

/**
 * Find and report deprecated references
 */
function findDeprecatedReferences() {
  console.log('🔍 Scanning for deprecated references...\n');
  
  const filesToCheck = [
    'README.md',
    'CHANGELOG.md',
    'src/**/*.mjs',
    'test/**/*.mjs',
    'docs/**/*.md',
  ];
  
  const issues = [];
  
  // Check specific important files
  const importantFiles = [
    join(ROOT, 'README.md'),
    join(ROOT, 'src', 'index.mjs'),
    join(ROOT, 'src', 'natural-language-specs.mjs'),
    join(ROOT, 'src', 'convenience.mjs'),
    join(ROOT, 'src', 'game-player.mjs'),
    join(ROOT, 'src', 'spec-templates.mjs'),
  ];
  
  for (const filePath of importantFiles) {
    if (!existsSync(filePath)) continue;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const ref of DEPRECATED_REFERENCES) {
          if (ref.pattern.test(line)) {
            issues.push({
              file: basename(filePath),
              line: i + 1,
              content: line.trim().substring(0, 80),
              pattern: ref.pattern.toString(),
            });
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  if (issues.length > 0) {
    console.log(`   ⚠️  Found ${issues.length} deprecated references:\n`);
    const grouped = {};
    for (const issue of issues) {
      if (!grouped[issue.file]) {
        grouped[issue.file] = [];
      }
      grouped[issue.file].push(issue);
    }
    
    for (const [file, fileIssues] of Object.entries(grouped)) {
      console.log(`   📄 ${file}:`);
      for (const issue of fileIssues.slice(0, 5)) {
        console.log(`      Line ${issue.line}: ${issue.content}...`);
      }
      if (fileIssues.length > 5) {
        console.log(`      ... and ${fileIssues.length - 5} more`);
      }
    }
    console.log();
  } else {
    console.log('   ✅ No deprecated references found\n');
  }
  
  return issues;
}

/**
 * Run hookwise garden
 */
function runHookwiseGarden() {
  console.log('🌱 Running Hookwise Garden...\n');
  
  try {
    const output = execSync('npx hookwise garden', { 
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: ROOT
    });
    
    const lines = output.split('\n');
    const summaryLine = lines.find(l => l.includes('Summary'));
    const passed = output.includes('✅ All checks passed');
    
    if (passed) {
      console.log('   ✅ All Hookwise checks passed\n');
    } else {
      console.log('   ⚠️  Some Hookwise checks failed\n');
      console.log(output);
    }
    
    return passed;
  } catch (error) {
    console.log(`   ⚠️  Hookwise garden failed: ${error.message}\n`);
    return false;
  }
}

/**
 * Check git state
 */
function checkGitState() {
  console.log('🔍 Checking git state...\n');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: ROOT });
    const lines = status.trim().split('\n').filter(l => l);
    
    const staged = lines.filter(l => l.match(/^[AM]/)).length;
    const modified = lines.filter(l => l.match(/^ M/)).length;
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
 * Check root directory cleanliness
 */
function checkRootCleanliness() {
  console.log('🧹 Checking root directory cleanliness...\n');
  
  const rootFiles = readdirSync(ROOT)
    .filter(f => {
      const stat = statSync(join(ROOT, f));
      return stat.isFile() && f.endsWith('.md');
    });
  
  const nonEssential = rootFiles.filter(f => !ESSENTIAL_FILES.includes(f));
  
  if (nonEssential.length > 0) {
    console.log(`   ⚠️  Found ${nonEssential.length} non-essential markdown files:\n`);
    for (const file of nonEssential) {
      console.log(`      - ${file}`);
    }
    console.log();
  } else {
    console.log('   ✅ Root directory is clean\n');
  }
  
  return nonEssential.length;
}

/**
 * Main function
 */
function main() {
  console.log('🌱 Enhanced Garden - Comprehensive Repository Cleanup\n');
  console.log('=' .repeat(60));
  console.log();
  
  // 1. Archive temp docs
  const archived = archiveTempDocs();
  
  // 2. Check for deprecated references
  const deprecatedRefs = findDeprecatedReferences();
  
  // 3. Check root cleanliness
  const nonEssential = checkRootCleanliness();
  
  // 4. Run hookwise garden
  const hookwisePassed = runHookwiseGarden();
  
  // 5. Check git state
  const gitState = checkGitState();
  
  // Summary
  console.log('=' .repeat(60));
  console.log('\n📊 Summary:\n');
  console.log(`   📦 Archived: ${archived} temporary docs`);
  console.log(`   🔍 Deprecated refs: ${deprecatedRefs.length} found`);
  console.log(`   🧹 Non-essential docs: ${nonEssential} in root`);
  console.log(`   🌱 Hookwise: ${hookwisePassed ? '✅ Passed' : '⚠️  Issues'}`);
  console.log(`   📝 Git changes: ${gitState?.total || 0} files\n`);
  
  if (deprecatedRefs.length > 0) {
    console.log('💡 Action needed:');
    console.log('   - Review and remove deprecated project references');
    console.log('   - Update comments and documentation\n');
  }
  
  if (nonEssential > 0) {
    console.log('💡 Action needed:');
    console.log('   - Archive or remove non-essential documentation\n');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { archiveTempDocs, findDeprecatedReferences, runHookwiseGarden, checkGitState, checkRootCleanliness };

