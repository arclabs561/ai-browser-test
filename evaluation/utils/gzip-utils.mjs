#!/usr/bin/env node
/**
 * Gzip Utilities
 * 
 * Shared utilities for reading gzipped JSON files.
 * Used across multiple evaluation utilities.
 */

import { createGunzip } from 'zlib';
import { createReadStream } from 'fs';

/**
 * Read gzipped JSON file
 */
export async function readGzippedJson(filePath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = createGunzip();
    const readStream = createReadStream(filePath);
    
    readStream.pipe(stream);
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch (e) {
        reject(e);
      }
    });
    stream.on('error', reject);
    readStream.on('error', reject);
  });
}

