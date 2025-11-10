/**
 * Environment Variable Loader
 * 
 * Loads environment variables from .env files.
 * Searches multiple locations to find .env file.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Load environment variables from .env file
 * 
 * @param {string} testFilePath - Path to the test file (usually import.meta.url)
 * @returns {void}
 */
export function loadEnv(testFilePath = import.meta.url) {
  // Convert URL to file path if needed
  let searchDir = typeof testFilePath === 'string' && testFilePath.startsWith('file://')
    ? dirname(fileURLToPath(testFilePath))
    : dirname(testFilePath);
  
  // Search up the directory tree for .env file
  const maxDepth = 10;
  let depth = 0;
  
  while (depth < maxDepth) {
    const envPath = join(searchDir, '.env');
    
    if (existsSync(envPath)) {
      try {
        const envContent = readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          // Skip comments and empty lines
          if (!trimmed || trimmed.startsWith('#')) {
            continue;
          }
          
          // Parse KEY=VALUE format
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
            
            // Only set if not already set (env vars take precedence)
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
        
        return; // Found and loaded .env file
      } catch (error) {
        // Silently fail if .env file can't be read
        console.warn(`[load-env] Failed to read .env file at ${envPath}: ${error.message}`);
        return;
      }
    }
    
    // Move up one directory
    const parentDir = dirname(searchDir);
    if (parentDir === searchDir) {
      // Reached root, stop searching
      break;
    }
    searchDir = parentDir;
    depth++;
  }
}

