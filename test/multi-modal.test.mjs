/**
 * Tests for multi-modal.mjs
 * Requires mocking Playwright Page objects
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  extractRenderedCode, 
  captureTemporalScreenshots,
  multiPerspectiveEvaluation,
  multiModalValidation
} from '../src/multi-modal.mjs';
import { ValidationError } from '../src/errors.mjs';
import { createMockPage } from './helpers/mock-page.mjs';
import { validateScreenshot } from '../src/judge.mjs';

describe('extractRenderedCode', () => {
  it('should extract rendered code from mock page', async () => {
    const mockPage = createMockPage({
      html: '<html><body><div id="test">Content</div></body></html>'
    });
    
    const result = await extractRenderedCode(mockPage);
    
    assert.ok(typeof result === 'object');
    assert.ok('html' in result);
    assert.ok('criticalCSS' in result);
    assert.ok('domStructure' in result);
    assert.ok('timestamp' in result);
  });

  it('should throw ValidationError for invalid page object', async () => {
    await assert.rejects(
      () => extractRenderedCode(null),
      ValidationError
    );
    
    await assert.rejects(
      () => extractRenderedCode({}),
      ValidationError
    );
  });
});

describe('captureTemporalScreenshots', () => {
  it('should capture temporal screenshots', async () => {
    const mockPage = createMockPage();
    
    const screenshots = await captureTemporalScreenshots(mockPage, 2, 1000);
    
    assert.ok(Array.isArray(screenshots));
    assert.ok(screenshots.length > 0);
    assert.ok(screenshots[0].path);
    assert.ok(typeof screenshots[0].frame === 'number');
    assert.ok(typeof screenshots[0].timestamp === 'number');
  });

  it('should respect fps and duration', async () => {
    const mockPage = createMockPage();
    
    const screenshots = await captureTemporalScreenshots(mockPage, 5, 1000);
    
    // 5 fps for 1 second = 5 frames
    assert.ok(screenshots.length >= 4 && screenshots.length <= 6);
  });

  it('should throw ValidationError for invalid page object', async () => {
    await assert.rejects(
      () => captureTemporalScreenshots(null),
      ValidationError
    );
  });
});

describe('multiPerspectiveEvaluation', () => {
  it('should evaluate from multiple perspectives', async () => {
    const mockValidateFn = async (path, prompt, context) => {
      return {
        enabled: false,
        provider: 'gemini',
        score: 8,
        issues: [],
        assessment: 'Good'
      };
    };
    
    const result = await multiPerspectiveEvaluation(
      mockValidateFn,
      'test-screenshot.png',
      { html: '<html></html>' },
      {},
      [
        {
          name: 'Test Persona',
          perspective: 'Test perspective',
          focus: ['test']
        }
      ]
    );
    
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.ok(result[0].persona);
    assert.ok(result[0].evaluation);
  });

  it('should use default personas if not provided', async () => {
    const mockValidateFn = async (path, prompt, context) => {
      return {
        enabled: false,
        provider: 'gemini',
        score: 8,
        issues: [],
        assessment: 'Good'
      };
    };
    
    const result = await multiPerspectiveEvaluation(
      mockValidateFn,
      'test-screenshot.png',
      { html: '<html></html>' }
    );
    
    assert.ok(Array.isArray(result));
    assert.ok(result.length >= 3); // At least 3 default personas
  });

  it('should throw ValidationError for invalid validate function', async () => {
    await assert.rejects(
      () => multiPerspectiveEvaluation(null, 'test.png', {}),
      ValidationError
    );
  });
});

describe('multiModalValidation', () => {
  it('should perform multi-modal validation', async () => {
    const mockPage = createMockPage();
    const mockValidateFn = async (path, prompt, context) => {
      return {
        enabled: false,
        provider: 'gemini',
        score: 8,
        issues: [],
        assessment: 'Good'
      };
    };
    
    const result = await multiModalValidation(
      mockValidateFn,
      mockPage,
      'test-validation',
      {
        fps: 1,
        duration: 500,
        captureCode: true,
        captureState: true,
        multiPerspective: false
      }
    );
    
    assert.ok(typeof result === 'object');
    assert.ok('screenshotPath' in result);
    assert.ok('renderedCode' in result);
    assert.ok('gameState' in result);
  });

  it('should throw ValidationError for invalid page object', async () => {
    const mockValidateFn = async () => ({ enabled: false });
    
    await assert.rejects(
      () => multiModalValidation(mockValidateFn, null, 'test'),
      ValidationError
    );
  });
});

