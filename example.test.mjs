/**
 * Example: Visual Testing with @vllm-testing/core
 * 
 * This example demonstrates how to use the VLLM testing package
 * for comprehensive visual regression testing with Playwright.
 */

import { test, expect } from '@playwright/test';
import { 
  validateScreenshot,
  extractRenderedCode,
  multiPerspectiveEvaluation,
  captureTemporalScreenshots,
  aggregateTemporalNotes,
  formatNotesForPrompt,
  createConfig
} from '@visual-ai/validate';

// Configure VLLM (optional - auto-detects from env vars)
const config = createConfig({
  provider: process.env.VLM_PROVIDER || 'gemini',
  cacheEnabled: true,
  verbose: process.env.DEBUG_VLLM === 'true'
});

test.describe('Visual Testing Examples', () => {
  
  test('basic screenshot validation', async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Capture screenshot
    const screenshotPath = `test-results/example-basic-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Validate with VLLM
    const result = await validateScreenshot(
      screenshotPath,
      'Evaluate this homepage for quality, accessibility, and brutalist design principles. Check for: high contrast (≥21:1), minimal design, clear typography, and functional layout.',
      {
        testType: 'homepage',
        viewport: { width: 1280, height: 720 }
      }
    );
    
    // Assertions
    expect(result.enabled).toBe(true);
    if (result.score !== null) {
      expect(result.score).toBeGreaterThanOrEqual(7); // Minimum acceptable score
    }
    expect(result.issues).toBeInstanceOf(Array);
    
    console.log(`Score: ${result.score}/10`);
    console.log(`Issues: ${result.issues.length}`);
    console.log(`Cost: $${result.estimatedCost?.totalCost || '0.000000'}`);
  });
  
  test('multi-modal validation with rendered code', async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Extract rendered code
    const renderedCode = await extractRenderedCode(page);
    
    // Capture screenshot
    const screenshotPath = `test-results/example-multimodal-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Multi-perspective evaluation
    const validateFn = (path, prompt, context) => 
      validateScreenshot(path, prompt, context);
    
    const evaluations = await multiPerspectiveEvaluation(
      validateFn,
      screenshotPath,
      renderedCode,
      {},
      [
        {
          name: 'Accessibility Advocate',
          perspective: 'Evaluate from accessibility viewpoint: WCAG compliance, contrast, keyboard navigation, screen reader support.',
          focus: ['accessibility', 'wcag', 'contrast']
        },
        {
          name: 'Brutalist Designer',
          perspective: 'Evaluate from brutalist design viewpoint: function over decoration, high contrast, minimal UI, direct language.',
          focus: ['brutalist', 'minimalism', 'function']
        }
      ]
    );
    
    // Assertions
    expect(evaluations.length).toBeGreaterThan(0);
    evaluations.forEach(evaluation => {
      expect(evaluation.persona).toBeDefined();
      expect(evaluation.evaluation).toBeDefined();
    });
    
    console.log(`Evaluations: ${evaluations.length} perspectives`);
  });
  
  test('temporal screenshot capture for animations', async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Capture temporal screenshots (for animations)
    const screenshots = await captureTemporalScreenshots(page, 2, 2000); // 2 fps, 2 seconds
    
    expect(screenshots.length).toBeGreaterThan(0);
    expect(screenshots[0].path).toBeDefined();
    expect(screenshots[0].timestamp).toBeDefined();
    
    console.log(`Captured ${screenshots.length} temporal screenshots`);
  });
  
  test('temporal aggregation for gameplay', async ({ page }) => {
    // Simulate gameplay notes
    const notes = [
      { 
        timestamp: Date.now(), 
        elapsed: 0,
        score: 8, 
        observation: 'Game starts smoothly',
        step: 'gameplay_note_start'
      },
      { 
        timestamp: Date.now() + 5000, 
        elapsed: 5000,
        score: 9, 
        observation: 'Ball movement is smooth',
        step: 'gameplay_note_movement'
      },
      { 
        timestamp: Date.now() + 10000, 
        elapsed: 10000,
        score: 8, 
        observation: 'Collision detection works well',
        step: 'gameplay_note_collision'
      }
    ];
    
    // Aggregate temporally
    const aggregated = aggregateTemporalNotes(notes, {
      windowSize: 10000, // 10 second windows
      decayFactor: 0.9
    });
    
    // Format for prompt
    const prompt = formatNotesForPrompt(aggregated);
    
    expect(aggregated.windows.length).toBeGreaterThan(0);
    expect(aggregated.coherence).toBeGreaterThan(0);
    expect(prompt.length).toBeGreaterThan(0);
    
    console.log(`Coherence: ${(aggregated.coherence * 100).toFixed(0)}%`);
    console.log(`Windows: ${aggregated.windows.length}`);
  });
  
  test('payment screen validation', async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Fill form to generate payment code
    await page.fill('#name', 'Test User');
    await page.fill('#amount', '10');
    await page.click('button[type="submit"]');
    
    // Wait for payment screen
    await page.waitForSelector('#payment:not(.hidden)', { timeout: 10000 });
    
    // Capture screenshot
    const screenshotPath = `test-results/example-payment-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Validate payment screen
    const result = await validateScreenshot(
      screenshotPath,
      `Evaluate the payment screen comprehensively:

PAYMENT CODE:
- Is the payment code clearly visible?
- Is contrast ≥21:1 (brutalist requirement)?
- Is the code format correct (Q-XXXX)?

QR CODES:
- Are both Venmo and Cash App QR codes present?
- Are QR codes scannable with ≥21:1 contrast?
- Are QR codes properly sized and positioned?

BRUTALIST DESIGN:
- Is text direct and functional (no conversational language)?
- Is design minimal and uncluttered?
- Is contrast excellent throughout?
- Are there no unnecessary decorative elements?

ZERO TOLERANCE VIOLATIONS:
- Contrast <21:1 = INSTANT FAIL
- QR codes not scannable = INSTANT FAIL
- Conversational language = INSTANT FAIL`,
      {
        testType: 'payment-screen',
        viewport: { width: 1280, height: 720 }
      }
    );
    
    // Assertions
    expect(result.enabled).toBe(true);
    if (result.score !== null) {
      expect(result.score).toBeGreaterThanOrEqual(7);
    }
    
    // Check for critical issues
    const criticalIssues = result.issues.filter(issue => 
      issue.toLowerCase().includes('contrast') || 
      issue.toLowerCase().includes('scannable') ||
      issue.toLowerCase().includes('fail')
    );
    
    expect(criticalIssues.length).toBe(0); // No critical issues
    
    console.log(`Payment screen score: ${result.score}/10`);
    console.log(`Critical issues: ${criticalIssues.length}`);
  });
  
  test('game UI validation', async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Activate game (press 'G')
    await page.keyboard.press('G');
    await page.waitForTimeout(1000); // Wait for game to initialize
    
    // Capture screenshot
    const screenshotPath = `test-results/example-game-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Get game state
    const gameState = await page.evaluate(() => {
      return window.gameState || {
        gameActive: false,
        bricks: [],
        ball: null,
        paddle: null
      };
    });
    
    // Validate game UI
    const result = await validateScreenshot(
      screenshotPath,
      `Evaluate the game UI comprehensively:

GAME STATE:
- Is the game active and visible?
- Are bricks properly rendered?
- Is the paddle visible and positioned correctly?
- Is the ball visible and moving?

BRUTALIST DESIGN:
- Is contrast ≥21:1 throughout?
- Is the design minimal and functional?
- Are there no unnecessary decorative elements?
- Is the game clearly an easter egg (not primary purpose)?

ACCESSIBILITY:
- Is the game keyboard accessible?
- Are controls clearly indicated?
- Is the game playable without mouse?`,
      {
        testType: 'game-ui',
        viewport: { width: 1280, height: 720 },
        gameState
      }
    );
    
    // Assertions
    expect(result.enabled).toBe(true);
    if (result.score !== null) {
      expect(result.score).toBeGreaterThanOrEqual(6); // Game is easter egg, lower threshold
    }
    
    console.log(`Game UI score: ${result.score}/10`);
  });
});

