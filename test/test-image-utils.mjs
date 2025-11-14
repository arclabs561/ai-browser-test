/**
 * Test Image Utilities
 * 
 * Shared utilities for creating test images in tests.
 * Ensures all test images meet minimum requirements for VLLM APIs.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';

/**
 * Create a valid test PNG
 * 
 * Uses a 100x100 pixel PNG for better compatibility with all VLLM APIs.
 * Some APIs (like Groq) may reject very small images (2x2) even though they're technically valid.
 * A 100x100 image is small enough for fast tests but large enough to be accepted by all providers.
 * 
 * NOTE: Tests should handle API errors gracefully (rate limits, invalid image format, etc.)
 * as these are external API limitations, not code bugs.
 */
export function createTempImage(path) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  // Try to create a 100x100 image using ImageMagick if available (most reliable)
  try {
    // Try magick (ImageMagick 7) first, then convert (ImageMagick 6)
    execSync(`magick convert -size 100x100 xc:red "${path}" 2>/dev/null || convert -size 100x100 xc:red "${path}" 2>/dev/null`, { stdio: 'ignore' });
    if (existsSync(path)) {
      return path;
    }
  } catch (e) {
    // ImageMagick not available or failed, use fallback
  }
  
  // Fallback: Use 100x100 pixel red PNG in base64 (works reliably with all VLLM APIs including Groq)
  // Generated with: magick convert -size 100x100 xc:red test.png && base64 test.png
  const testPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLAcXAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGUExURf8AAP///0EdNBEAAAABYktHRAH/Ai3eAAAAB3RJTUUH6QsOEzomg1TgZQAAABRJREFUOMtjYBgFo2AUjIJRQE8AAAV4AAEpcbn8AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDI1LTExLTE0VDE5OjU4OjM4KzAwOjAwY33jRAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyNS0xMS0xNFQxOTo1ODozOCswMDowMBIgW/gAAAAodEVYdGRhdGU6dGltZXN0YW1wADIwMjUtMTEtMTQ1OTo1ODozOCswMDowMEU1eicAAAAASUVORK5CYII=', 'base64');
  writeFileSync(path, testPng);
  return path;
}

/**
 * Create a larger test image (10x10) for more complex tests
 * 
 * NOTE: This is kept for backward compatibility but createTempImage now creates 100x100 images.
 * Consider using createTempImage instead for better API compatibility.
 */
export function createLargerTestImage(path) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  // 10x10 pixel PNG in base64
  const largerPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  writeFileSync(path, largerPng);
  return path;
}
