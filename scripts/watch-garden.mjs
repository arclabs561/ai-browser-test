#!/usr/bin/env node
/**
 * Watch mode for Hookwise Garden
 * Runs garden checks continuously, watching for file changes
 */

import { watch } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const CHECK_INTERVAL = 30000; // 30 seconds
let lastCheck = 0;

function runGarden() {
  const now = Date.now();
  if (now - lastCheck < CHECK_INTERVAL) {
    return; // Throttle checks
  }
  lastCheck = now;
  
  console.log('\n🌱 Running Hookwise Garden...\n');
  try {
    execSync('npm run garden', { 
      stdio: 'inherit',
      cwd: REPO_ROOT 
    });
  } catch (error) {
    // Non-blocking - just log
    console.error('Garden check had issues (non-blocking)');
  }
}

// Watch for file changes
const watcher = watch(REPO_ROOT, { recursive: true }, (eventType, filename) => {
  if (filename && !filename.includes('node_modules') && !filename.includes('.git')) {
    runGarden();
  }
});

// Also run on interval
setInterval(runGarden, CHECK_INTERVAL);

// Run immediately
runGarden();

console.log('🌱 Hookwise Garden Watch Mode');
console.log('   Watching for changes...');
console.log('   Running checks every 30 seconds');
console.log('   Press Ctrl+C to stop\n');

// Cleanup on exit
process.on('SIGINT', () => {
  watcher.close();
  process.exit(0);
});

