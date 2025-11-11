/**
 * Environment Variable Loader
 * 
 * Loads environment variables from .env file if it exists.
 * Works in both local development and deployed environments.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load environment variables from .env file
 * 
 * @param {string} basePath - Base path to search for .env file (optional)
 * @returns {boolean} - True if .env file was found and loaded
 */
export function loadEnv(basePath = null) {
  // Try multiple locations for .env file
  const possiblePaths = basePath 
    ? [
        join(basePath, '.env'),
        join(basePath, '..', '.env'),
        join(basePath, '../..', '.env')
      ]
    : [
        join(process.cwd(), '.env'),
        join(__dirname, '..', '.env'),
        join(__dirname, '../../..', '.env'),
        join(__dirname, '../../../..', '.env')
      ];

  for (const envPath of possiblePaths) {
    if (existsSync(envPath)) {
      try {
        const envContent = readFileSync(envPath, 'utf8');
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
            let value = match[2].trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            
            // Only set if not already set (env vars take precedence)
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
        
        return true;
      } catch (err) {
        // Silently fail - .env is optional
        return false;
      }
    }
  }
  
  return false;
}

