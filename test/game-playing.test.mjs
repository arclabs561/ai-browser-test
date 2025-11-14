/**
 * Game Playing Tests
 * 
 * Tests for game playing functionality (playGame and GameGym).
 * Originally motivated by interactive web applications that require
 * real-time validation, variable goals, and temporal understanding.
 * 
 * These tests validate that the package can actually play games, not just test them.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { playGame, GameGym } from '../src/index.mjs';

test('playGame - simple game', async () => {
  // Skip if no API keys or Playwright not available
  if (process.env.GEMINI_API_KEY === undefined) {
    test.skip('No API key configured');
    return;
  }
  
  // Skip if Playwright not available (this test requires real browser)
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto('https://play2048.co/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Wait for game to load
      
      const result = await playGame(page, {
        goal: 'Maximize score',
        maxSteps: 5, // Small number for testing
        fps: 1 // Slow for testing
      });
      
      // Verify result structure
      assert.ok(result);
      assert.ok('history' in result);
      assert.ok('totalSteps' in result);
      assert.ok('goal' in result);
      assert.ok(result.totalSteps > 0);
      assert.ok(result.history.length > 0);
    } finally {
      await browser.close();
    }
  } catch (error) {
    if (error.message.includes('Cannot find module') || error.message.includes('playwright')) {
      test.skip('Playwright not available');
    } else {
      throw error;
    }
  }
});

test('GameGym - external iterator', async () => {
  // Skip if no API keys
  if (process.env.GEMINI_API_KEY === undefined) {
    test.skip('No API key configured');
    return;
  }
  
  // Skip if Playwright not available
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto('https://play2048.co/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const gym = new GameGym(page, {
        goal: 'Maximize score',
        maxSteps: 5,
        fps: 1
      });
      
      let obs = await gym.reset();
      assert.ok(obs);
      assert.ok(obs.screenshot);
      assert.ok(obs.evaluation);
      
      let stepCount = 0;
      while (!gym.done && stepCount < 5) {
        // Simple action selection (move right)
        const action = { type: 'keyboard', key: 'ArrowRight' };
        const result = await gym.step(action);
        
        assert.ok(result);
        assert.ok('observation' in result);
        assert.ok('reward' in result);
        assert.ok('done' in result);
        assert.ok('info' in result);
        
        obs = result.observation;
        stepCount++;
      }
      
      assert.ok(stepCount > 0);
    } finally {
      await browser.close();
    }
  } catch (error) {
    if (error.message.includes('Cannot find module') || error.message.includes('playwright')) {
      test.skip('Playwright not available');
    } else {
      throw error;
    }
  }
});

test('testGameplay with play option', async () => {
  // Skip if no API keys
  if (process.env.GEMINI_API_KEY === undefined) {
    test.skip('No API key configured');
    return;
  }
  
  // Skip if Playwright not available
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto('https://play2048.co/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const { testGameplay } = await import('../src/convenience.mjs');
      const result = await testGameplay(page, {
        url: 'https://play2048.co/',
        play: true, // Actually play
        goal: 'Maximize score',
        maxSteps: 3
      });
      
      assert.ok(result);
      assert.ok('totalSteps' in result);
      assert.ok(result.totalSteps > 0);
    } finally {
      await browser.close();
    }
  } catch (error) {
    if (error.message.includes('Cannot find module') || error.message.includes('playwright')) {
      test.skip('Playwright not available');
    } else {
      throw error;
    }
  }
});
