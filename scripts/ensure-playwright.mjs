#!/usr/bin/env node
/**
 * Ensure Playwright is Available
 * 
 * Checks if Playwright is installed and provides helpful installation instructions.
 * Can optionally install Playwright if requested.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const PLAYWRIGHT_PACKAGE = '@playwright/test';
const PLAYWRIGHT_CORE = 'playwright';

/**
 * Check if Playwright is installed
 */
function isPlaywrightInstalled() {
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  const playwrightTestPath = join(nodeModulesPath, '@playwright', 'test');
  const playwrightCorePath = join(nodeModulesPath, PLAYWRIGHT_CORE);
  
  return existsSync(playwrightTestPath) || existsSync(playwrightCorePath);
}

/**
 * Install Playwright
 */
function installPlaywright() {
  console.log('📦 Installing Playwright...\n');
  try {
    // Install as dev dependency
    execSync('npm install --save-dev @playwright/test', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('\n✅ Playwright installed successfully');
    console.log('📝 Run "npx playwright install --with-deps chromium" to install browser binaries\n');
    return true;
  } catch (error) {
    console.error('\n❌ Failed to install Playwright:', error.message);
    console.error('💡 Try: npm install --save-dev @playwright/test\n');
    return false;
  }
}

/**
 * Install browser binaries
 */
function installBrowsers() {
  console.log('🌐 Installing Playwright browser binaries...\n');
  try {
    // Install with system dependencies for better compatibility
    execSync('npx playwright install --with-deps chromium', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('\n✅ Browser binaries installed successfully\n');
    return true;
  } catch (error) {
    console.error('\n❌ Failed to install browser binaries:', error.message);
    console.error('💡 Try: npx playwright install --with-deps chromium\n');
    return false;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const install = args.includes('--install') || args.includes('-i');
  const installBrowsersFlag = args.includes('--install-browsers') || args.includes('-b');
  
  if (isPlaywrightInstalled()) {
    console.log('✅ Playwright is installed\n');
    
    if (installBrowsersFlag) {
      installBrowsers();
    }
    
    return 0;
  }
  
  console.log('⚠️  Playwright is not installed\n');
  console.log('To install Playwright, run:');
  console.log('  npm install --save-dev @playwright/test');
  console.log('  npx playwright install chromium\n');
  
  if (install) {
    if (installPlaywright()) {
      if (installBrowsersFlag) {
        installBrowsers();
      } else {
        console.log('💡 Tip: Run with --install-browsers to also install browser binaries\n');
      }
      return 0;
    }
    return 1;
  }
  
  console.log('💡 Tip: Run with --install to automatically install Playwright\n');
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}

export { isPlaywrightInstalled, installPlaywright, installBrowsers };

