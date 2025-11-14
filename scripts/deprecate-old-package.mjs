#!/usr/bin/env node
/**
 * Deprecate Old Package
 * 
 * Deprecates the old ai-browser-test package on npm with a message
 * directing users to the new ai-visual-test package.
 */

import { execSync } from 'child_process';

const OLD_PACKAGE = 'ai-browser-test';
const NEW_PACKAGE = 'ai-visual-test';
const DEPRECATION_MESSAGE = `This package has been renamed to ${NEW_PACKAGE}. Please use 'npm install ${NEW_PACKAGE}' instead. See https://www.npmjs.com/package/${NEW_PACKAGE} for the latest version.`;

console.log(`📦 Deprecating ${OLD_PACKAGE}...\n`);

try {
  // Check if we're logged into npm
  execSync('npm whoami', { stdio: 'pipe' });
  
  console.log(`✅ Logged into npm`);
  console.log(`\n⚠️  About to deprecate ${OLD_PACKAGE}`);
  console.log(`   Message: ${DEPRECATION_MESSAGE}\n`);
  
  // Deprecate the package
  execSync(`npm deprecate ${OLD_PACKAGE} "${DEPRECATION_MESSAGE}"`, {
    stdio: 'inherit'
  });
  
  console.log(`\n✅ Successfully deprecated ${OLD_PACKAGE}`);
  console.log(`   Users will see a deprecation warning when installing it`);
  console.log(`   They'll be directed to use ${NEW_PACKAGE} instead\n`);
  
} catch (error) {
  if (error.message.includes('whoami')) {
    console.error(`❌ Not logged into npm. Please run 'npm login' first.`);
  } else {
    console.error(`❌ Error deprecating package: ${error.message}`);
    console.error(`\n💡 To deprecate manually, run:`);
    console.error(`   npm deprecate ${OLD_PACKAGE} "${DEPRECATION_MESSAGE}"`);
  }
  process.exit(1);
}

