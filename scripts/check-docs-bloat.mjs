#!/usr/bin/env node
/**
 * Documentation Bloat Checker for Pre-commit Hook
 * 
 * Checks for excessive or redundant documentation files that should be archived.
 * Can optionally use LLM to analyze content for redundancy.
 * 
 * Features:
 * - Counts markdown files in root directory
 * - Detects temporary analysis documents (FINAL_*, COMPLETE_*, etc.)
 * - Checks for files that should be archived
 * - Optional LLM-based redundancy detection
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
// Load environment variables before importing LLM utils
import { loadEnv } from '../src/load-env.mjs';
loadEnv();
// Use shared LLM utility library
import { detectProvider, callLLM, extractJSON } from '@arclabs561/llm-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Patterns for temporary/analysis documents that should be archived
const TEMP_DOC_PATTERNS = [
  /^FINAL_/i,
  /^COMPLETE_/i,
  /^SESSION_/i,
  /^ANALYSIS_/i,
  /^CRITICAL_/i,
  /^DEEP_/i,
  /^EXECUTION_/i,
  /^IMPLEMENTATION_/i,
  /^VALIDATION_/i,
  /_REVIEW\.md$/i,
  /_ANALYSIS\.md$/i,
  /_PLAN\.md$/i,
  /_SUMMARY\.md$/i,
  /_RECOMMENDATIONS?\.md$/i,
  /_IMPROVEMENTS?\.md$/i,
  /_STATUS\.md$/i,
  /_REPORT\.md$/i,
];

// Essential documentation files that should stay in root
const ESSENTIAL_DOCS = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'SECURITY.md',
  'DEPLOYMENT.md',
];

// Maximum number of markdown files allowed in root (excluding essential docs)
const MAX_ROOT_MD_FILES = 5;

// Archive directory path
const ARCHIVE_DIR = join(__dirname, '..', 'archive', 'analysis-docs');

/**
 * Get staged markdown files
 */
function getStagedMarkdownFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
    return output.trim().split('\n')
      .filter(Boolean)
      .filter(file => file.endsWith('.md') || file.endsWith('.MD'));
  } catch (error) {
    return [];
  }
}

/**
 * Get all markdown files in root directory with metadata
 */
function getRootMarkdownFiles() {
  const rootDir = join(__dirname, '..');
  try {
    const files = readdirSync(rootDir);
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    
    return files
      .filter(file => {
        const filePath = join(rootDir, file);
        try {
          const stats = statSync(filePath);
          return stats.isFile() && (file.endsWith('.md') || file.endsWith('.MD'));
        } catch {
          return false;
        }
      })
      .map(file => {
        const filePath = join(rootDir, file);
        const stats = statSync(filePath);
        const mtime = stats.mtime.getTime();
        const age = now - mtime;
        const ageDays = Math.floor(age / (24 * 60 * 60 * 1000));
        
        return {
          name: file,
          path: filePath,
          size: stats.size,
          mtime: mtime,
          ageDays: ageDays,
          isOld: age > thirtyDaysAgo,
          isVeryOld: age > ninetyDaysAgo,
        };
      });
  } catch (error) {
    return [];
  }
}

/**
 * Check if file matches temporary document pattern
 */
function isTemporaryDoc(filename) {
  return TEMP_DOC_PATTERNS.some(pattern => pattern.test(filename));
}

/**
 * Check if file is essential documentation
 */
function isEssentialDoc(filename) {
  return ESSENTIAL_DOCS.includes(filename);
}

/**
 * Get file size in bytes
 */
function getFileSize(filepath) {
  try {
    const stats = statSync(filepath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Simple content similarity check (Jaccard similarity on word sets)
 */
function calculateSimilarity(content1, content2) {
  const words1 = new Set(content1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(content2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Check for similar content between files
 */
function findSimilarContent(files, threshold = 0.3) {
  const similarities = [];
  
  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      try {
        const content1 = readFileSync(files[i].path, 'utf-8');
        const content2 = readFileSync(files[j].path, 'utf-8');
        
        // Only compare first 5000 chars to avoid memory issues
        const sim = calculateSimilarity(
          content1.substring(0, 5000),
          content2.substring(0, 5000)
        );
        
        if (sim >= threshold) {
          similarities.push({
            file1: files[i].name,
            file2: files[j].name,
            similarity: sim,
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
  }
  
  return similarities;
}

/**
 * Get archived files and analyze patterns
 */
function getArchivedFiles() {
  if (!existsSync(ARCHIVE_DIR)) {
    return [];
  }
  
  try {
    const files = readdirSync(ARCHIVE_DIR);
    return files
      .filter(file => file.endsWith('.md') || file.endsWith('.MD'))
      .map(file => ({
        name: file,
        path: join(ARCHIVE_DIR, file),
      }));
  } catch (error) {
    return [];
  }
}

/**
 * Analyze archive patterns to infer what should be caught
 */
function analyzeArchivePatterns(archivedFiles) {
  if (archivedFiles.length === 0) {
    return null;
  }
  
  const patterns = {
    prefixes: {},
    suffixes: {},
    keywords: {},
    total: archivedFiles.length,
  };
  
  archivedFiles.forEach(file => {
    const name = file.name;
    
    // Analyze prefixes
    const prefixMatch = name.match(/^([A-Z_]+)_/);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      patterns.prefixes[prefix] = (patterns.prefixes[prefix] || 0) + 1;
    }
    
    // Analyze suffixes
    const suffixMatch = name.match(/_([A-Z_]+)\.md$/i);
    if (suffixMatch) {
      const suffix = suffixMatch[1];
      patterns.suffixes[suffix] = (patterns.suffixes[suffix] || 0) + 1;
    }
    
    // Extract keywords
    const keywords = name.match(/\b(ANALYSIS|REVIEW|PLAN|SUMMARY|CRITIQUE|RECOMMENDATION|IMPROVEMENT|STATUS|REPORT|COMPLETE|FINAL|DEEP|CRITICAL)\b/gi);
    if (keywords) {
      keywords.forEach(kw => {
        const key = kw.toUpperCase();
        patterns.keywords[key] = (patterns.keywords[key] || 0) + 1;
      });
    }
  });
  
  return patterns;
}

/**
 * Compare current files to archived patterns
 */
function compareToArchive(currentFiles, archivePatterns) {
  if (!archivePatterns) {
    return null;
  }
  
  const matches = [];
  const suggestions = [];
  
  currentFiles.forEach(file => {
    const name = file.name;
    const nameUpper = name.toUpperCase();
    let matched = false;
    const reasons = [];
    let confidence = 0;
    
    // Check against archived prefixes (exact match)
    const prefixMatch = name.match(/^([A-Z_]+)_/);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      if (archivePatterns.prefixes[prefix]) {
        matched = true;
        confidence += 2;
        reasons.push(`prefix "${prefix}" (${archivePatterns.prefixes[prefix]} similar files archived)`);
      }
    }
    
    // Check against archived suffixes (exact match)
    const suffixMatch = name.match(/_([A-Z_]+)\.md$/i);
    if (suffixMatch) {
      const suffix = suffixMatch[1];
      if (archivePatterns.suffixes[suffix]) {
        matched = true;
        confidence += 2;
        reasons.push(`suffix "${suffix}" (${archivePatterns.suffixes[suffix]} similar files archived)`);
      }
    }
    
    // Check against keywords (more flexible - any keyword that appears in archive)
    const keywords = nameUpper.match(/\b(ANALYSIS|REVIEW|PLAN|SUMMARY|CRITIQUE|RECOMMENDATION|IMPROVEMENT|STATUS|REPORT|COMPLETE|FINAL|DEEP|CRITICAL|EXECUTION|IMPLEMENTATION|VALIDATION|METHODOLOGY|SECURITY|DESIGN|GITHUB)\b/g);
    if (keywords) {
      keywords.forEach(kw => {
        const key = kw.toUpperCase();
        if (archivePatterns.keywords[key] && archivePatterns.keywords[key] >= 1) {
          matched = true;
          confidence += 1;
          reasons.push(`keyword "${key}" (${archivePatterns.keywords[key]} similar files archived)`);
        }
      });
    }
    
    // Also check if file name contains any archived prefix/suffix as substring
    Object.entries(archivePatterns.prefixes).forEach(([prefix, count]) => {
      if (count >= 2 && nameUpper.includes(prefix) && !reasons.some(r => r.includes(`prefix "${prefix}"`))) {
        matched = true;
        confidence += 1;
        reasons.push(`contains prefix pattern "${prefix}" (${count} similar files archived)`);
      }
    });
    
    Object.entries(archivePatterns.suffixes).forEach(([suffix, count]) => {
      if (count >= 2 && nameUpper.includes(suffix) && !reasons.some(r => r.includes(`suffix "${suffix}"`))) {
        matched = true;
        confidence += 1;
        reasons.push(`contains suffix pattern "${suffix}" (${count} similar files archived)`);
      }
    });
    
    if (matched) {
      matches.push({
        file: name,
        reasons: reasons,
        confidence: confidence,
      });
    }
  });
  
  // Generate suggestions based on archive patterns
  const topPrefixes = Object.entries(archivePatterns.prefixes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topSuffixes = Object.entries(archivePatterns.suffixes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topPrefixes.length > 0 || topSuffixes.length > 0) {
    suggestions.push({
      type: 'pattern_learning',
      message: `Based on ${archivePatterns.total} archived files, common patterns include:`,
      topPrefixes: topPrefixes.map(([p, c]) => `${p} (${c} files)`),
      topSuffixes: topSuffixes.map(([s, c]) => `${s} (${c} files)`),
    });
  }
  
  return {
    matches,
    suggestions,
    archiveSize: archivePatterns.total,
  };
}

/**
 * Use LLM to check for redundant content (if available)
 */
async function checkRedundancyWithLLM(files, llmConfig) {
  if (!llmConfig) {
    return null;
  }

  // Limit to first 5 files to avoid token limits
  const filesToCheck = files.slice(0, 5);
  
  // Read file contents (limit size to avoid token limits)
  const fileContents = [];
  for (const file of filesToCheck) {
    try {
      const content = readFileSync(file.path, 'utf-8');
      // Truncate to first 2000 chars per file
      const truncated = content.length > 2000 
        ? content.substring(0, 2000) + '... [truncated]'
        : content;
      fileContents.push({
        name: file.name,
        content: truncated
      });
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  if (fileContents.length < 2) {
    return null; // Need at least 2 files to check redundancy
  }

  // Get more context for better analysis
  const rootFiles = getRootMarkdownFiles();
  const archiveInfo = getArchivedFiles().length > 0 
    ? `\nNote: ${getArchivedFiles().length} similar files have been archived previously.`
    : '';
  
  const prompt = `You are an expert technical writer analyzing documentation files for redundancy and bloat. Provide intelligent, context-aware recommendations.

DOCUMENTATION FILES TO ANALYZE:
${fileContents.map((f, i) => `\n${i + 1}. ${f.name}:\n${f.content.substring(0, 1500)}${f.content.length > 1500 ? '... [truncated]' : ''}`).join('\n\n---\n')}

CONTEXT:
- Total root markdown files: ${rootFiles.length}${archiveInfo}
- These files are in the repository root (should be minimal)

EVALUATION CRITERIA:
1. **Redundancy**: Do files cover the same topic? Can they be consolidated?
2. **Temporality**: Are these temporary analysis/planning documents that should be archived?
3. **Completeness**: Do files serve a clear, ongoing purpose?
4. **Organization**: Should files be in docs/ or archive/ instead of root?
5. **Value**: Is the content still relevant and useful?

ARCHIVE PATTERNS (learn from history):
- Files with prefixes: FINAL_, COMPLETE_, SESSION_, ANALYSIS_, CRITICAL_, DEEP_
- Files with suffixes: _REVIEW.md, _ANALYSIS.md, _PLAN.md, _SUMMARY.md, _RECOMMENDATIONS.md
- Files that are snapshots of work-in-progress thinking

GOOD DOCUMENTATION PRACTICES:
- Root should have: README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE, SECURITY.md
- Detailed docs should be in docs/ directory
- Historical/archived docs should be in archive/
- Each file should have a clear, ongoing purpose

Return ONLY valid JSON:
{
  "redundant_groups": [
    {
      "files": ["file1.md", "file2.md"],
      "reason": "specific explanation of why redundant",
      "recommendation": "consolidate into single file or archive",
      "confidence": "high|medium|low"
    }
  ],
  "should_archive": ["file1.md", "file2.md"],
  "summary": "brief summary of findings and recommendations",
  "reasoning": "explanation of why these recommendations were made"
}

Return ONLY valid JSON, no other text.`;

  try {
    const response = await callLLM(
      prompt, 
      llmConfig.provider, 
      llmConfig.apiKey,
      { tier: 'simple', maxTokens: 2000 }
    );
    return extractJSON(response);
  } catch (error) {
    // Silently fail - LLM analysis is optional
    return null;
  }
}

/**
 * Validate repository state before processing
 */
function validateRepositoryState() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('⚠️  Warning: Not in a git repository, some checks may be limited');
    return false;
  }
}

/**
 * Analyze documentation bloat
 */
async function analyzeDocBloat() {
  // Validate repository state first
  const isGitRepo = validateRepositoryState();
  
  const issues = [];
  const warnings = [];
  
  const rootMdFiles = getRootMarkdownFiles();
  const stagedMdFiles = isGitRepo ? getStagedMarkdownFiles() : [];
  
  // Analyze archive to learn patterns
  const archivedFiles = getArchivedFiles();
  const archivePatterns = analyzeArchivePatterns(archivedFiles);
  const archiveComparison = archivePatterns 
    ? compareToArchive(rootMdFiles, archivePatterns)
    : null;
  
  // Count non-essential markdown files
  const nonEssentialFiles = rootMdFiles.filter(
    file => !isEssentialDoc(file.name)
  );
  
  // Check for temporary documents
  const tempDocs = rootMdFiles.filter(file => isTemporaryDoc(file.name));
  
  // Check staged files for temporary patterns
  const stagedTempDocs = stagedMdFiles.filter(file => {
    const filename = file.split('/').pop();
    return isTemporaryDoc(filename);
  });
  
  // Check if too many markdown files in root
  if (nonEssentialFiles.length > MAX_ROOT_MD_FILES) {
    issues.push({
      type: 'too_many_files',
      message: `Too many markdown files in root directory (${nonEssentialFiles.length}, max ${MAX_ROOT_MD_FILES})`,
      files: nonEssentialFiles.map(f => f.name),
      suggestion: `Consider archiving ${nonEssentialFiles.length - MAX_ROOT_MD_FILES} file(s) to archive/analysis-docs/`,
    });
  }
  
  // Check for temporary documents in root
  if (tempDocs.length > 0) {
    issues.push({
      type: 'temporary_docs',
      message: `Found ${tempDocs.length} temporary/analysis document(s) in root`,
      files: tempDocs.map(f => f.name),
      suggestion: 'These files should be archived to archive/analysis-docs/',
    });
  }
  
  // Check for staged temporary documents
  if (stagedTempDocs.length > 0) {
    issues.push({
      type: 'staging_temporary_docs',
      message: `Attempting to commit ${stagedTempDocs.length} temporary document(s)`,
      files: stagedTempDocs,
      suggestion: 'Archive these files instead of committing them to root',
    });
  }
  
  // Check for very large documentation files (potential bloat)
  const largeFiles = rootMdFiles.filter(file => {
    return file.size > 100 * 1024; // 100KB
  });
  
  if (largeFiles.length > 0) {
    warnings.push({
      type: 'large_files',
      message: `Found ${largeFiles.length} large documentation file(s) (>100KB)`,
      files: largeFiles.map(f => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)}KB`,
      })),
      suggestion: 'Consider splitting large files or moving detailed content to archive/',
    });
  }
  
  // Check for old files that should be archived
  const oldFiles = nonEssentialFiles.filter(file => file.isOld && !isTemporaryDoc(file.name));
  if (oldFiles.length > 0) {
    warnings.push({
      type: 'old_files',
      message: `Found ${oldFiles.length} old documentation file(s) (>30 days)`,
      files: oldFiles.map(f => ({
        name: f.name,
        age: `${f.ageDays} days`,
      })),
      suggestion: 'Consider archiving old files that are no longer actively maintained',
    });
  }
  
  // Check for very old files (definitely should be archived)
  const veryOldFiles = nonEssentialFiles.filter(file => file.isVeryOld);
  if (veryOldFiles.length > 0) {
    issues.push({
      type: 'very_old_files',
      message: `Found ${veryOldFiles.length} very old documentation file(s) (>90 days)`,
      files: veryOldFiles.map(f => ({
        name: f.name,
        age: `${f.ageDays} days`,
      })),
      suggestion: 'These files should be archived to archive/analysis-docs/',
    });
  }
  
  // Check for content similarity (simple text-based)
  if (nonEssentialFiles.length > 1) {
    const similarFiles = findSimilarContent(nonEssentialFiles, 0.3);
    if (similarFiles.length > 0) {
      warnings.push({
        type: 'similar_content',
        message: `Found ${similarFiles.length} pair(s) of files with similar content`,
        pairs: similarFiles.map(p => ({
          files: [p.file1, p.file2],
          similarity: `${(p.similarity * 100).toFixed(1)}%`,
        })),
        suggestion: 'Consider consolidating files with similar content',
      });
    }
  }
  
  // Check for duplicate-sounding names
  const nameGroups = {};
  rootMdFiles.forEach(file => {
    const baseName = file.name
      .replace(/\.md$/i, '')
      .replace(/^(FINAL_|COMPLETE_|DEEP_|CRITICAL_)/i, '')
      .toLowerCase();
    
    if (!nameGroups[baseName]) {
      nameGroups[baseName] = [];
    }
    nameGroups[baseName].push(file.name);
  });
  
  const duplicates = Object.entries(nameGroups)
    .filter(([_, files]) => files.length > 1)
    .map(([base, files]) => ({ base, files }));
  
  if (duplicates.length > 0) {
    warnings.push({
      type: 'duplicate_names',
      message: `Found ${duplicates.length} group(s) of potentially duplicate documentation`,
      groups: duplicates,
      suggestion: 'Review these files for redundancy and consider consolidating',
    });
  }
  
  // Use archive comparison to identify files that match archived patterns
  if (archiveComparison && archiveComparison.matches.length > 0) {
    // Show all matches, but prioritize high confidence ones
    const highConfidenceMatches = archiveComparison.matches.filter(m => m.confidence >= 2);
    const mediumConfidenceMatches = archiveComparison.matches.filter(m => m.confidence === 1);
    
    if (highConfidenceMatches.length > 0) {
      issues.push({
        type: 'archive_pattern_match',
        message: `Found ${highConfidenceMatches.length} file(s) matching patterns from ${archiveComparison.archiveSize} archived files`,
        files: highConfidenceMatches.map(m => ({
          name: m.file,
          reasons: m.reasons,
        })),
        suggestion: 'These files match patterns of previously archived documents and should be archived',
      });
    }
    
    if (mediumConfidenceMatches.length > 0) {
      warnings.push({
        type: 'archive_pattern_match_weak',
        message: `Found ${mediumConfidenceMatches.length} file(s) with potential matches to archived patterns`,
        files: mediumConfidenceMatches.map(m => ({
          name: m.file,
          reasons: m.reasons,
        })),
        suggestion: 'Consider reviewing these files - they may match patterns of archived documents',
      });
    }
    
    // Add archive-based suggestions
    if (archiveComparison.suggestions.length > 0) {
      warnings.push(...archiveComparison.suggestions);
    }
  }
  
  // Use LLM for redundancy analysis if available
  const llmConfig = detectProvider();
  if (llmConfig && nonEssentialFiles.length > 1) {
    try {
      const llmAnalysis = await checkRedundancyWithLLM(nonEssentialFiles, llmConfig);
      if (llmAnalysis) {
        if (llmAnalysis.redundant_groups && llmAnalysis.redundant_groups.length > 0) {
          warnings.push({
            type: 'llm_redundancy',
            message: 'LLM detected redundant documentation groups',
            llm_analysis: llmAnalysis,
            suggestion: 'Consider consolidating or archiving redundant files',
          });
        }
        if (llmAnalysis.should_archive && llmAnalysis.should_archive.length > 0) {
          issues.push({
            type: 'llm_archive_recommendation',
            message: `LLM recommends archiving ${llmAnalysis.should_archive.length} file(s)`,
            files: llmAnalysis.should_archive,
            summary: llmAnalysis.summary,
            reasoning: llmAnalysis.reasoning,
            suggestion: 'Archive these files to archive/analysis-docs/',
          });
        }
        
        if (llmAnalysis.reasoning) {
          warnings.push({
            type: 'llm_analysis_insight',
            message: 'LLM analysis insights',
            reasoning: llmAnalysis.reasoning,
          });
        }
      }
    } catch (error) {
      // Silently fail - LLM analysis is optional
    }
  }
  
  return { 
    issues, 
    warnings, 
    llmAvailable: !!llmConfig,
    archiveStats: archivePatterns ? {
      totalArchived: archivePatterns.total,
      patternsFound: Object.keys(archivePatterns.prefixes).length + Object.keys(archivePatterns.suffixes).length,
    } : null,
  };
}

/**
 * Main function
 */
async function main() {
  const { issues, warnings, llmAvailable, archiveStats } = await analyzeDocBloat();
  
  if (issues.length === 0 && warnings.length === 0) {
    return 0;
  }
  
  console.error('\n⚠️  Documentation Bloat Detected\n');
  
  // Report issues (blocking)
  if (issues.length > 0) {
    console.error('Issues (please fix before committing):\n');
    issues.forEach((issue, idx) => {
      console.error(`${idx + 1}. ${issue.message}`);
      if (issue.files && issue.files.length > 0) {
        console.error('   Files:');
        issue.files.slice(0, 10).forEach(file => {
          console.error(`     - ${file}`);
        });
        if (issue.files.length > 10) {
          console.error(`     ... and ${issue.files.length - 10} more`);
        }
      }
      if (issue.summary) {
        console.error(`   Summary: ${issue.summary}`);
      }
      if (issue.files && Array.isArray(issue.files) && issue.files[0]?.reasons) {
        console.error('   Archive pattern matches:');
        issue.files.forEach(f => {
          console.error(`     - ${f.name}: ${f.reasons.join(', ')}`);
        });
      }
      if (issue.suggestion) {
        console.error(`   💡 ${issue.suggestion}`);
      }
      console.error('');
    });
  }
  
  // Report warnings (non-blocking)
  if (warnings.length > 0) {
    console.error('Warnings (consider addressing):\n');
    warnings.forEach((warning, idx) => {
      console.error(`${idx + 1}. ${warning.message}`);
      if (warning.files) {
        console.error('   Files:');
        warning.files.slice(0, 5).forEach(file => {
          const fileInfo = typeof file === 'string' ? file : `${file.name} (${file.size})`;
          console.error(`     - ${fileInfo}`);
        });
        if (warning.files.length > 5) {
          console.error(`     ... and ${warning.files.length - 5} more`);
        }
      }
      if (warning.groups) {
        console.error('   Groups:');
        warning.groups.forEach(({ base, files }) => {
          console.error(`     "${base}": ${files.join(', ')}`);
        });
      }
      if (warning.pairs) {
        console.error('   Similar pairs:');
        warning.pairs.forEach((pair, i) => {
          console.error(`     ${i + 1}. ${pair.files.join(' ↔ ')} (${pair.similarity} similar)`);
        });
      }
      if (warning.llm_analysis) {
        if (warning.llm_analysis.redundant_groups) {
          console.error('   LLM Redundancy Analysis:');
          warning.llm_analysis.redundant_groups.forEach((group, i) => {
            console.error(`     Group ${i + 1}: ${group.files.join(', ')}`);
            console.error(`       Reason: ${group.reason}`);
            console.error(`       Recommendation: ${group.recommendation}`);
          });
        }
        if (warning.llm_analysis.summary) {
          console.error(`   LLM Summary: ${warning.llm_analysis.summary}`);
        }
      }
      if (warning.type === 'pattern_learning') {
        console.error(`   Learned from ${archiveStats?.totalArchived || 0} archived files:`);
        if (warning.topPrefixes && warning.topPrefixes.length > 0) {
          console.error(`     Common prefixes: ${warning.topPrefixes.join(', ')}`);
        }
        if (warning.topSuffixes && warning.topSuffixes.length > 0) {
          console.error(`     Common suffixes: ${warning.topSuffixes.join(', ')}`);
        }
      }
      if (warning.type === 'archive_pattern_match_weak') {
        console.error('   Archive pattern matches:');
        warning.files.forEach(f => {
          console.error(`     - ${f.name}: ${f.reasons.join(', ')}`);
        });
      }
      if (warning.suggestion) {
        console.error(`   💡 ${warning.suggestion}`);
      }
      console.error('');
    });
  }
  
  // Archive stats
  if (archiveStats) {
    console.error(`📊 Archive analysis: ${archiveStats.totalArchived} files archived, ${archiveStats.patternsFound} patterns identified`);
  }
  
  // LLM availability info
  if (llmAvailable) {
    console.error('💡 LLM analysis was used for redundancy detection');
  } else {
    console.error('💡 Set OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY for LLM-based redundancy analysis');
  }
  
  if (issues.length > 0) {
    console.error('Please archive or remove temporary documentation files before committing.');
    console.error('See archive/analysis-docs/ for examples of archived documentation.\n');
    return 1;
  }
  
  return 0;
}

// Run if executed directly (check if this file is being run, not imported)
const runningAsScript = process.argv[1] && (
  process.argv[1].includes('check-docs-bloat.mjs') ||
  fileURLToPath(import.meta.url) === process.argv[1]
);

if (runningAsScript) {
  main().then(code => process.exit(code)).catch(error => {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  });
}

export { analyzeDocBloat, isTemporaryDoc, isEssentialDoc };

