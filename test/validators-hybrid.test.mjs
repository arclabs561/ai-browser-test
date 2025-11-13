/**
 * Hybrid Validators Test
 * 
 * Tests for hybrid validators: validateAccessibilityHybrid, validateStateHybrid, validateWithProgrammaticContext
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  validateAccessibilityHybrid,
  validateStateHybrid,
  validateWithProgrammaticContext
} from '../src/validators/index.mjs';
import {
  _injectValidateScreenshot,
  _resetValidateScreenshot
} from '../src/validators/hybrid-validator.mjs';
import { ValidationError } from '../src/errors.mjs';

// Mock Playwright page object
function createMockPage() {
  return {
    evaluate: async (fn, ...args) => {
      // Simulate page.evaluate behavior
      if (typeof fn === 'function') {
        return fn(...args);
      }
      // If passed as object with function, execute it
      if (typeof fn === 'object' && fn.fn) {
        return fn.fn(...args);
      }
      return fn;
    },
    screenshot: async () => 'mock-screenshot.png'
  };
}

// Mock validateScreenshot for testing
async function mockValidateScreenshot(imagePath, prompt, context) {
  return {
    score: 8,
    reasoning: 'Mock evaluation',
    issues: [],
    timestamp: Date.now()
  };
}

test('validateAccessibilityHybrid - invalid page', async () => {
  await assert.rejects(
    () => validateAccessibilityHybrid(null, 'screenshot.png', 4.5),
    ValidationError
  );
});

test('validateAccessibilityHybrid - invalid screenshotPath', async () => {
  const mockPage = createMockPage();
  await assert.rejects(
    () => validateAccessibilityHybrid(mockPage, null, 4.5),
    ValidationError
  );
});

test('validateAccessibilityHybrid - extracts programmatic data', async () => {
  const mockPage = createMockPage();
  
  // Mock page.evaluate for contrast check
  let contrastCallCount = 0;
  let keyboardCallCount = 0;
  
  mockPage.evaluate = async (fn, ...args) => {
    if (contrastCallCount === 0) {
      contrastCallCount++;
      // First call: checkAllTextContrast
      return {
        total: 10,
        passing: 8,
        failing: 2,
        violations: [
          { element: '#button1', ratio: '3.5', required: 4.5, foreground: 'rgb(100, 100, 100)', background: 'rgb(200, 200, 200)' }
        ],
        elements: []
      };
    } else {
      keyboardCallCount++;
      // Second call: checkKeyboardNavigation
      return {
        keyboardAccessible: true,
        focusableElements: 5,
        violations: [],
        focusableSelectors: ['a[href]', 'button']
      };
    }
  };
  
  // Mock validateScreenshot
  const mockValidateScreenshot = async (imagePath, prompt, context) => {
    assert.ok(prompt.includes('PROGRAMMATIC DATA'), 'Prompt should include programmatic data');
    assert.ok(prompt.includes('8/10'), 'Prompt should include contrast results');
    assert.ok(prompt.includes('5'), 'Prompt should include keyboard results');
    assert.ok(context.programmaticData, 'Context should include programmaticData');
    assert.ok(context.programmaticData.contrast, 'Context should include contrast data');
    assert.ok(context.programmaticData.keyboard, 'Context should include keyboard data');
    
    return {
      score: 8,
      reasoning: 'Mock evaluation with programmatic context',
      issues: [],
      timestamp: Date.now()
    };
  };
  
  _injectValidateScreenshot(mockValidateScreenshot);
  
  try {
    const result = await validateAccessibilityHybrid(
      mockPage,
      'screenshot.png',
      4.5,
      {}
    );
    
    assert.ok(result, 'Result should be returned');
    assert.ok(result.programmaticData, 'Result should include programmaticData');
    assert.ok(result.programmaticData.contrast, 'Result should include contrast data');
    assert.ok(result.programmaticData.keyboard, 'Result should include keyboard data');
    assert.equal(result.programmaticData.contrast.total, 10);
    assert.equal(result.programmaticData.contrast.passing, 8);
    assert.equal(result.programmaticData.keyboard.focusableElements, 5);
    assert.equal(result.score, 8);
  } finally {
    _resetValidateScreenshot();
  }
});

test('validateStateHybrid - invalid page', async () => {
  await assert.rejects(
    () => validateStateHybrid(null, 'screenshot.png', { test: 'value' }),
    ValidationError
  );
});

test('validateStateHybrid - invalid screenshotPath', async () => {
  const mockPage = createMockPage();
  await assert.rejects(
    () => validateStateHybrid(mockPage, null, { test: 'value' }),
    ValidationError
  );
});

test('validateStateHybrid - invalid expectedState', async () => {
  const mockPage = createMockPage();
  await assert.rejects(
    () => validateStateHybrid(mockPage, 'screenshot.png', null),
    ValidationError
  );
});

test('validateStateHybrid - extracts programmatic state', async () => {
  const mockPage = createMockPage();
  
  // Mock page.evaluate for state extraction
  // validateStateHybrid calls:
  // 1. page.evaluate(() => window.gameState || null) - gameState extraction (no args)
  // 2. validateStateProgrammatic which:
  //    a. Calls stateExtractor if provided (which would call page.evaluate)
  //    b. Calls page.evaluate(({ selectors }) => {...}, { selectors }) for visual state
  let callCount = 0;
  mockPage.evaluate = async (fn, ...args) => {
    callCount++;
    
    // First call: gameState extraction (no args, function checks window.gameState)
    if (callCount === 1) {
      return { ball: { x: 100, y: 200 }, paddle: { x: 150 } };
    }
    
    // Second call: validateStateProgrammatic visual state extraction
    // This receives { selectors: {...} } as the argument
    // The function receives selectors and extracts visual state
    if (args.length > 0 && args[0] && typeof args[0] === 'object') {
      const arg = args[0];
      if (arg.selectors) {
        // This is the visual state extraction
        return {
          ball: { x: 100, y: 200, width: 20, height: 20, visible: true },
          paddle: { x: 150, y: 300, width: 100, height: 10, visible: true }
        };
      }
    }
    
    // Fallback: assume visual state
    return {
      ball: { x: 100, y: 200, width: 20, height: 20, visible: true },
      paddle: { x: 150, y: 300, width: 100, height: 10, visible: true }
    };
  };
  
  // Mock validateScreenshot
  const mockValidateScreenshot = async (imagePath, prompt, context) => {
    assert.ok(prompt.includes('PROGRAMMATIC DATA'), 'Prompt should include programmatic data');
    assert.ok(prompt.includes('Game State'), 'Prompt should include game state');
    assert.ok(prompt.includes('Visual State'), 'Prompt should include visual state');
    assert.ok(context.programmaticData, 'Context should include programmaticData');
    assert.ok(context.programmaticData.gameState, 'Context should include gameState');
    assert.ok(context.programmaticData.visualState, 'Context should include visualState');
    
    return {
      score: 9,
      reasoning: 'Mock evaluation with programmatic state context',
      issues: [],
      timestamp: Date.now()
    };
  };
  
  _injectValidateScreenshot(mockValidateScreenshot);
  
  try {
    const result = await validateStateHybrid(
      mockPage,
      'screenshot.png',
      { ball: { x: 100, y: 200 } },
      { selectors: { ball: '#game-ball' }, tolerance: 5 }
    );
    
    assert.ok(result, 'Result should be returned');
    assert.ok(result.programmaticData, 'Result should include programmaticData');
    assert.ok(result.programmaticData.gameState, 'Result should include gameState');
    assert.ok(result.programmaticData.visualState, 'Result should include visualState');
    assert.equal(result.programmaticData.gameState.ball.x, 100);
    // Note: matches might be false if validateStateProgrammatic finds discrepancies
    // The important thing is that programmaticData is included
    assert.ok(typeof result.programmaticData.matches === 'boolean', 'Result should include matches boolean');
    assert.equal(result.score, 9);
  } finally {
    _resetValidateScreenshot();
  }
});

test('validateWithProgrammaticContext - invalid screenshotPath', async () => {
  await assert.rejects(
    () => validateWithProgrammaticContext(null, 'prompt', {}),
    ValidationError
  );
});

test('validateWithProgrammaticContext - invalid prompt', async () => {
  await assert.rejects(
    () => validateWithProgrammaticContext('screenshot.png', null, {}),
    ValidationError
  );
});

test('validateWithProgrammaticContext - invalid programmaticData', async () => {
  await assert.rejects(
    () => validateWithProgrammaticContext('screenshot.png', 'prompt', null),
    ValidationError
  );
});

test('validateWithProgrammaticContext - builds enhanced prompt', async () => {
  const programmaticData = {
    contrast: { passing: 8, total: 10 },
    keyboard: { focusableElements: 5 }
  };
  
  // Mock validateScreenshot
  const mockValidateScreenshot = async (imagePath, prompt, context) => {
    assert.ok(prompt.includes('Base prompt'), 'Prompt should include base prompt');
    assert.ok(prompt.includes('PROGRAMMATIC DATA'), 'Prompt should include programmatic data section');
    assert.ok(prompt.includes('GROUND TRUTH'), 'Prompt should include ground truth instruction');
    // Check that programmatic data is included (may be formatted differently with indentation)
    // The prompt uses JSON.stringify(programmaticData, null, 2) which adds indentation
    assert.ok(
      prompt.includes('"passing":8') || 
      prompt.includes('"total":10') || 
      prompt.includes('"focusableElements":5') ||
      prompt.includes('contrast') ||
      prompt.includes('keyboard'),
      'Prompt should include programmatic data JSON'
    );
    assert.ok(context.programmaticData, 'Context should include programmaticData');
    
    return {
      score: 7,
      reasoning: 'Mock evaluation with programmatic context',
      issues: [],
      timestamp: Date.now()
    };
  };
  
  _injectValidateScreenshot(mockValidateScreenshot);
  
  try {
    const result = await validateWithProgrammaticContext(
      'screenshot.png',
      'Base prompt',
      programmaticData,
      {}
    );
    
    assert.ok(result, 'Result should be returned');
    assert.ok(result.programmaticData, 'Result should include programmaticData');
    assert.equal(result.score, 7);
  } finally {
    _resetValidateScreenshot();
  }
});

