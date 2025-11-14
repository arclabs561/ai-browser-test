// Hookwise configuration for ai-visual-test
// Minimal, robust configuration focused on essential checks

export default {
  // Extend essential groups
  extends: ['security', 'quality', 'docs'],
  
  // Commit message validation - for changelog generation
  commitMessage: {
    enabled: true,
    blocking: true,
    minScore: 7,
    requireBody: ['feat', 'fix', 'refactor', 'perf'],
    requireBreakingChangeFooter: true,
  },
  
  // Code quality - essential checks only
  codeQuality: {
    enabled: true,
    blocking: true,
    checks: {
      consoleLog: {
        enabled: true,
        severity: 'warning',
        exclude: ['*.test.*', 'test/**', 'evaluation/**', 'scripts/**', 'src/logger.mjs'],
      },
      todos: {
        enabled: true,
        severity: 'warning',
        requireContext: true,
        exclude: ['*.test.*', 'test/**', 'evaluation/**', 'docs/**'],
      },
      testAntiPatterns: {
        enabled: true,
        severity: 'error',
      },
    },
  },
  
  // Documentation bloat - aggressive for this repo
  documentation: {
    enabled: true,
    blocking: true,
    maxRootFiles: 6,
    archiveAgeDays: 30,
    archivePatterns: [
      { pattern: /^COMPLETION_/i, reason: 'Completion summaries are temporary', priority: 'high' },
      { pattern: /_SUMMARY\.md$/i, reason: 'Summary documents should be archived', priority: 'high' },
      { pattern: /_REPORT\.md$/i, reason: 'Report documents should be archived', priority: 'high' },
      { pattern: /_ANALYSIS\.md$/i, reason: 'Analysis documents should be archived', priority: 'high' },
      { pattern: /^DEEP_/i, reason: 'Deep analysis documents should be archived', priority: 'high' },
      { pattern: /^FINAL_/i, reason: 'Final summaries should be archived', priority: 'high' },
      { pattern: /^CRITICAL_/i, reason: 'Critical review docs should be archived', priority: 'high' },
      { pattern: /^MCP_/i, reason: 'MCP review docs should be archived', priority: 'high' },
      { pattern: /^COMMIT_/i, reason: 'Commit planning docs should be archived', priority: 'high' },
      { pattern: /^GIT_/i, reason: 'Git status docs should be archived', priority: 'high' },
      { pattern: /^REPOSITORY_/i, reason: 'Repository status docs should be archived', priority: 'high' },
      { pattern: /_PLAN\.md$/i, reason: 'Planning documents should be archived', priority: 'high' },
      { pattern: /_STATUS\.md$/i, reason: 'Status documents should be archived', priority: 'high' },
    ],
    essentialFiles: [
      'README.md',
      'CHANGELOG.md',
      'CONTRIBUTING.md',
      'DEPLOYMENT.md',
      'SECURITY.md',
      'LICENSE',
    ],
  },
  
  // Security - critical for npm package
  security: {
    enabled: true,
    blocking: true,
    checks: {
      secrets: {
        enabled: true,
        severity: 'error',
        exclude: ['*.test.*', 'test/**', '.secretsignore'],
      },
    },
  },
  
  // Ignore patterns
  ignore: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'archive/**',
    'docs-generated/**',
    'test-results/**',
    'evaluation/results/**',
    'evaluation/cache/**',
    '.husky/**',
    '*.log',
  ],
};
