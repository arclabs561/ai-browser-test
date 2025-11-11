#!/usr/bin/env node
/**
 * Commit Message Validator
 * 
 * Validates commit messages follow conventional commits format.
 * Can be used standalone or as a git hook.
 */

// Load environment variables before importing LLM utils
import { loadEnv } from '../src/load-env.mjs';
loadEnv();
// Use shared LLM utility library
import { detectProvider, callLLM, extractJSON } from '@arclabs561/llm-utils';

const CONVENTIONAL_TYPES = [
  'feat',      // New feature
  'fix',       // Bug fix
  'docs',      // Documentation changes
  'style',     // Code style changes (formatting, etc.)
  'refactor',  // Code refactoring
  'perf',      // Performance improvements
  'test',      // Adding or updating tests
  'build',     // Build system changes
  'ci',        // CI/CD changes
  'chore',     // Other changes (maintenance, etc.)
  'revert',    // Revert previous commit
];

const CONVENTIONAL_PATTERN = new RegExp(
  `^(${CONVENTIONAL_TYPES.join('|')})(\\(.+?\\))?: .+`,
  'i'
);

/**
 * Validate commit message
 */
function validateCommitMessage(message) {
  const lines = message.trim().split('\n');
  const subject = lines[0];
  
  // Skip validation for merge commits, revert commits, and fixup/squash commits
  if (/^(Merge |Revert |fixup!|squash!)/i.test(subject)) {
    return { valid: true, skip: true };
  }
  
  // Check format
  if (!CONVENTIONAL_PATTERN.test(subject)) {
    return {
      valid: false,
      error: 'Invalid commit message format',
      subject,
    };
  }
  
  // Extract type and scope
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/i);
  if (!match) {
    return { valid: false, error: 'Could not parse commit message', subject };
  }
  
  const [, type, scope, description] = match;
  
  // Validate type
  if (!CONVENTIONAL_TYPES.includes(type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid type: ${type}. Must be one of: ${CONVENTIONAL_TYPES.join(', ')}`,
      subject,
    };
  }
  
  // Check subject length
  const issues = [];
  if (description.length < 10) {
    issues.push(`Subject is very short (${description.length} chars)`);
  }
  if (description.length > 72) {
    issues.push(`Subject is long (${description.length} chars, recommended: <72)`);
  }
  
  // Check for period at end (not recommended)
  if (description.endsWith('.')) {
    issues.push('Subject should not end with a period');
  }
  
  return {
    valid: true,
    type: type.toLowerCase(),
    scope: scope || null,
    description,
    issues: issues.length > 0 ? issues : null,
  };
}

/**
 * Use LLM to analyze commit message quality
 */
async function analyzeCommitMessageWithLLM(message, stagedFiles, llmConfig) {
  if (!llmConfig) {
    return null;
  }

  // Get file changes summary
  const filesChanged = stagedFiles?.length || 0;
  const fileTypes = stagedFiles 
    ? [...new Set(stagedFiles.map(f => f.split('.').pop() || 'unknown'))].join(', ')
    : 'unknown';

  // Get more context for better analysis
  const recentCommits = await getRecentCommitHistory(5);
  const branchName = await getCurrentBranch();
  
  const prompt = `You are an expert code reviewer analyzing a git commit message. Provide intelligent, context-aware feedback.

COMMIT MESSAGE:
${message}

CONTEXT:
- Files Changed: ${filesChanged} (${fileTypes})
- Current Branch: ${branchName || 'unknown'}
- Recent Commits: ${recentCommits.length > 0 ? recentCommits.map(c => `"${c}"`).join(', ') : 'none'}

EVALUATION CRITERIA:
1. **Accuracy**: Does the message accurately describe what changed?
2. **Clarity**: Is it clear and concise? Would a teammate understand it?
3. **Convention**: Does it follow Conventional Commits (type(scope): subject)?
4. **Completeness**: Is important context included (breaking changes, scope)?
5. **Consistency**: Does it match the style of recent commits?

CONVENTIONAL COMMITS FORMAT:
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Format: type(scope): subject
- Body (optional): Detailed explanation
- Footer (optional): Breaking changes, issue references

EXAMPLES OF GOOD COMMITS:
- "feat(judge): add bias detection to scoring"
- "fix(cache): handle race condition in concurrent requests"
- "docs: update README with installation steps"
- "refactor(extractor): simplify JSON parsing logic"

Return ONLY valid JSON:
{
  "valid": true/false,
  "score": 0-10,
  "issues": ["specific issue 1", "specific issue 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
  "improved_message": "complete improved message if needed",
  "reasoning": "brief explanation of score and issues"
}

Return ONLY valid JSON, no other text.`;

  try {
    const response = await callLLM(
      prompt, 
      llmConfig.provider, 
      llmConfig.apiKey,
      { tier: 'simple', maxTokens: 1000 }
    );
    return extractJSON(response);
  } catch (error) {
    // Silently fail - LLM analysis is optional
    return null;
  }
}

/**
 * Get staged files for context
 */
async function getStagedFiles() {
  try {
    const { execSync } = await import('child_process');
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

/**
 * Get recent commit history for context
 */
async function getRecentCommitHistory(limit = 5) {
  try {
    const { execSync } = await import('child_process');
    const output = execSync(`git log --oneline -n ${limit} --format="%s"`, { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

/**
 * Get current branch name
 */
async function getCurrentBranch() {
  try {
    const { execSync } = await import('child_process');
    const output = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' });
    return output.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Validate repository state before processing
 */
async function validateRepositoryState() {
  try {
    const { execSync } = await import('child_process');
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch (error) {
    // Not in git repo - that's okay for standalone testing
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  // Validate repository state first (for context gathering)
  const isGitRepo = await validateRepositoryState();
  
  const commitMsgFile = process.argv[2] || process.env.GIT_PARAMS;
  
  let message;
  if (commitMsgFile) {
    const fs = await import('fs');
    if (!fs.existsSync(commitMsgFile)) {
      console.error(`❌ Commit message file not found: ${commitMsgFile}`);
      process.exit(1);
    }
    message = fs.readFileSync(commitMsgFile, 'utf-8');
  } else {
    // Read from stdin if no file provided
    let messageData = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      messageData += chunk;
    }
    message = messageData;
  }
  
  // Basic validation first
  const result = validateCommitMessage(message);
  
  if (!result.valid) {
    console.error(`❌ ${result.error}`);
    console.error(`\nYour message: "${result.subject}"`);
    console.error('\nFormat: type(scope): subject');
    console.error(`Types: ${CONVENTIONAL_TYPES.join(', ')}`);
    console.error('\nExamples:');
    console.error('  feat: add new feature');
    console.error('  fix(judge): handle API errors');
    console.error('  docs: update README');
    process.exit(1);
  }
  
  // Show basic warnings
  if (result.issues) {
    result.issues.forEach(issue => {
      console.error(`⚠️  Warning: ${issue}`);
    });
  }
  
  // Optional LLM analysis if available (only if in git repo for context)
  const llmConfig = detectProvider();
  if (llmConfig && isGitRepo) {
    try {
      const stagedFiles = await getStagedFiles();
      const llmAnalysis = await analyzeCommitMessageWithLLM(message, stagedFiles, llmConfig);
      
      if (llmAnalysis) {
        if (llmAnalysis.score !== undefined) {
          console.error(`\n💡 LLM Analysis: Score ${llmAnalysis.score}/10`);
        }
        
        if (llmAnalysis.issues && llmAnalysis.issues.length > 0) {
          console.error('   Issues:');
          llmAnalysis.issues.forEach(issue => {
            console.error(`     - ${issue}`);
          });
        }
        
        if (llmAnalysis.suggestions && llmAnalysis.suggestions.length > 0) {
          console.error('   Suggestions:');
          llmAnalysis.suggestions.forEach(suggestion => {
            console.error(`     - ${suggestion}`);
          });
        }
        
               if (llmAnalysis.improved_message && llmAnalysis.improved_message !== message.trim()) {
                 console.error(`\n   💡 Suggested improved message:\n   ${llmAnalysis.improved_message}`);
               }
               
               if (llmAnalysis.reasoning) {
                 console.error(`\n   📝 Reasoning: ${llmAnalysis.reasoning}`);
               }
               
               // Don't fail on LLM feedback, just warn
               if (llmAnalysis.score !== undefined && llmAnalysis.score < 5) {
                 console.error('\n⚠️  LLM suggests significant improvements to commit message');
                 console.error('💡 Tip: Use the suggested message above or address the issues listed');
               }
      }
    } catch (error) {
      // Silently fail - LLM is optional
    }
  }
  
  return 0;
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('validate-commit-msg.mjs')) {
  main().then(code => process.exit(code || 0)).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

export { validateCommitMessage, CONVENTIONAL_TYPES };

