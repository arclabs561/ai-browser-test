#!/usr/bin/env node
/**
 * Setup Human Validation for Queeraoke
 * 
 * This script can be run in the queeraoke repository to enable human validation
 * for all Queeraoke tests. It creates a setup file that Queeraoke can import.
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const QUEERAOKE_DIR = '/Users/arc/Documents/dev/queeraoke';
const SETUP_FILE = join(QUEERAOKE_DIR, 'human-validation-setup.mjs');

/**
 * Create human validation setup file for Queeraoke
 */
function createQueeraokeSetup() {
  const setupContent = `/**
 * Human Validation Setup for Queeraoke
 * 
 * Import this file at the top of your test files to enable human validation.
 * 
 * Usage:
 *   import { initQueeraokeHumanValidation } from './human-validation-setup.mjs';
 *   
 *   // At the start of your test file
 *   initQueeraokeHumanValidation();
 * 
 * This will automatically collect VLLM judgments and request human validation
 * for interesting cases during your tests.
 */

import { initHumanValidation, getHumanValidationManager } from 'ai-visual-test';

let queeraokeHumanValidationInitialized = false;

/**
 * Initialize human validation for Queeraoke tests
 * 
 * @param {Object} options - Optional configuration
 * @param {Function} options.humanValidatorFn - Custom human validator function
 * @param {boolean} options.enabled - Enable/disable human validation
 * @param {boolean} options.smartSampling - Enable smart sampling
 */
export function initQueeraokeHumanValidation(options = {}) {
  if (queeraokeHumanValidationInitialized) {
    return getHumanValidationManager();
  }
  
  const {
    enabled = true,
    smartSampling = true,
    humanValidatorFn = null
  } = options;
  
  const manager = initHumanValidation({
    enabled,
    autoCollect: true,
    smartSampling,
    humanValidatorFn: humanValidatorFn || defaultQueeraokeHumanValidator
  });
  
  queeraokeHumanValidationInitialized = true;
  
  console.log('[Queeraoke] Human validation enabled');
  console.log('[Queeraoke] VLLM judgments will be collected automatically');
  console.log('[Queeraoke] Human validation requested for interesting cases');
  
  return manager;
}

/**
 * Default human validator for Queeraoke
 * 
 * In production, you would implement your own UI to collect human feedback.
 * This is a placeholder that logs the request.
 */
async function defaultQueeraokeHumanValidator(vllmJudgment) {
  console.log(\`\\n[Queeraoke] Human Validation Requested\`);
  console.log(\`   Test: \${vllmJudgment.context?.testType || 'unknown'}\`);
  console.log(\`   VLLM Score: \${vllmJudgment.vllmScore}/10\`);
  console.log(\`   VLLM Issues: \${vllmJudgment.vllmIssues.join(', ') || 'None'}\`);
  console.log(\`   Screenshot: \${vllmJudgment.screenshot}\`);
  console.log(\`\\n   💡 Implement your UI here to collect human feedback\`);
  console.log(\`   💡 Return: { score: number, issues: string[], reasoning: string }\`);
  console.log(\`   💡 Or return null to skip this validation\`);
  
  // Return null to skip (implement your UI)
  return null;
}

/**
 * Get human validation manager
 */
export function getQueeraokeHumanValidationManager() {
  return getHumanValidationManager();
}

/**
 * Check calibration status
 */
export function getQueeraokeCalibrationStatus() {
  const manager = getHumanValidationManager();
  return manager.getCalibrationStatus();
}

/**
 * Manually trigger calibration
 */
export async function calibrateQueeraokeHumanValidation() {
  const manager = getHumanValidationManager();
  return await manager.calibrate();
}
`;

  if (!existsSync(QUEERAOKE_DIR)) {
    console.log(`⚠️  Queeraoke directory not found: ${QUEERAOKE_DIR}`);
    console.log(`   Creating setup file in current directory instead...`);
    writeFileSync('human-validation-setup.mjs', setupContent);
    console.log(`   ✅ Created: human-validation-setup.mjs`);
    return;
  }
  
  writeFileSync(SETUP_FILE, setupContent);
  console.log(`✅ Created human validation setup file:`);
  console.log(`   ${SETUP_FILE}`);
  console.log(`\n📋 Next steps in Queeraoke:`);
  console.log(`   1. Import in your test files:`);
  console.log(`      import { initQueeraokeHumanValidation } from './human-validation-setup.mjs';`);
  console.log(`\n   2. Initialize at the start of tests:`);
  console.log(`      initQueeraokeHumanValidation();`);
  console.log(`\n   3. All validateScreenshot() calls will automatically collect data`);
  console.log(`\n   4. Implement your humanValidatorFn to collect feedback`);
  console.log(`\n   5. Check calibration: getQueeraokeCalibrationStatus()`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createQueeraokeSetup();
}

export { createQueeraokeSetup };

