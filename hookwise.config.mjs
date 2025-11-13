// Hookwise configuration for ai-visual-test
// Uses groups/presets system (similar to ESLint extends)
//
// This repo has experienced patterns of:
// - Analysis/summary documents (*_SUMMARY.md, *_REPORT.md, COMPLETION_*, etc.)
// - Ground truth/annotation docs (GROUND_TRUTH_*, HUMAN_GROUND_TRUTH_*, ANNOTATION_*)
// - Validation framework docs (VALIDATION_FRAMEWORK_*)
// - Security reviews (SECURITY_*, NPM_PACKAGE_SECURITY_*)
// - Publishing guides (PUBLISH_* - these should stay in root)

export default {
  // Extend groups/presets (like ESLint extends)
  // Groups: security, quality, docs, strict, minimal
  // Presets: standard, production, library, prototype
  extends: ['security', 'quality', 'strict'],
  
  // Override specific settings (like ESLint rules)
  commitMessage: {
    enabled: true,
    blocking: true,
    tier: 'advanced',
    minScore: 7,
    timeout: 10000,
  },
  
  // Code quality overrides
  codeQuality: {
    enabled: true,
    blocking: true,
    // Override specific checks
    checks: {
      consoleLog: {
        enabled: true,
        severity: 'warning',  // warning | error
        exclude: ['*.test.*', 'test/**', 'evaluation/**', 'scripts/**'],  // Allow in test/eval/scripts
      },
      todos: {
        enabled: true,
        severity: 'warning',
        requireContext: true,
        // Note: TODOs in test files are allowed with context
        exclude: ['*.test.*', 'test/**'],
      },
      testAntiPatterns: {
        enabled: true,
        severity: 'error',
      },
    },
  },
  
  // Documentation overrides - tuned for this repo's patterns
  documentation: {
    enabled: true,
    blocking: false,
    maxRootFiles: 10,  // Essential docs: README, CHANGELOG, CONTRIBUTING, DEPLOYMENT, SECURITY, plus publishing/annotation guides (10 actual files)
    // Custom archive patterns based on this repo's experience
    archivePatterns: [
      // Analysis/summary patterns (very common in this repo)
      { pattern: /^COMPLETION_/i, reason: 'Completion summaries are temporary analysis docs' },
      { pattern: /^COMPREHENSIVE_/i, reason: 'Comprehensive summaries are temporary analysis docs' },
      { pattern: /^IMPROVEMENTS?_/i, reason: 'Improvement summaries are temporary analysis docs' },
      { pattern: /_SUMMARY\.md$/i, reason: 'Summary documents should be archived' },
      { pattern: /_REPORT\.md$/i, reason: 'Report documents should be archived' },
      { pattern: /_ANALYSIS\.md$/i, reason: 'Analysis documents should be archived' },
      { pattern: /^DEEP_/i, reason: 'Deep analysis documents should be archived' },
      { pattern: /^FINAL_/i, reason: 'Final summaries should be archived' },
      { pattern: /^VALIDATION_FRAMEWORK_/i, reason: 'Validation framework reports should be archived' },
      
      // Ground truth/annotation patterns
      { pattern: /^GROUND_TRUTH_/i, reason: 'Ground truth docs should be archived' },
      { pattern: /^HUMAN_GROUND_TRUTH_/i, reason: 'Human ground truth docs should be archived' },
      { pattern: /^ANNOTATION_/i, reason: 'Annotation guides should be archived (except README_ANNOTATION.md)' },
      { pattern: /^ENHANCED_ANNOTATION_/i, reason: 'Enhanced annotation docs should be archived' },
      
      // Security review patterns (keep NPM_PACKAGE_SECURITY_ASSESSMENT.md, archive others)
      { pattern: /^SECURITY_RED_TEAM_REVIEW/i, reason: 'Security review reports should be archived' },
      
      // Inventory/quick start patterns
      { pattern: /_INVENTORY\.md$/i, reason: 'Inventory documents should be archived' },
      { pattern: /_QUICK_START\.md$/i, reason: 'Quick start guides should be archived (unless essential)' },
    ],
    // Files that should stay in root even if they match patterns
    essentialFiles: [
      'README.md',
      'CHANGELOG.md',
      'CONTRIBUTING.md',
      'DEPLOYMENT.md',
      'SECURITY.md',
      'LICENSE',
      // Publishing guides are essential for this repo
      'PUBLISH_INSTRUCTIONS.md',
      'PUBLISH_PASSKEY_GUIDE.md',
      // Security assessment is essential
      'NPM_PACKAGE_SECURITY_ASSESSMENT.md',
      // Annotation README is essential
      'README_ANNOTATION.md',
      // Human invocation ready is essential
      'HUMAN_INVOCATION_READY.md',
    ],
  },
  
  // Security overrides
  security: {
    enabled: true,
    blocking: true,
    // Inherited from group if extends includes 'security'
  },
  
  // Ignore patterns (like .eslintignore)
  ignore: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.next/**',
    'archive/**',  // Don't check archived files
    'docs-generated/**',  // Generated docs
    'test-results/**',  // Test results
    'evaluation/results/**',  // Evaluation results
    'evaluation/cache/**',  // Evaluation cache
  ],
  
  // Custom prompts (optional)
  // prompts: {
  //   'commit-message': './config/prompts/commit-message.mjs',
  // },
  
  // Custom rules (optional)
  // rules: {
  //   'conventional-commits': './config/rules/conventional-commits.mjs',
  // },
};
