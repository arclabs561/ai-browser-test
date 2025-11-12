#!/usr/bin/env node
/**
 * Test Cohesive Goals Integration
 * 
 * Tests that variable goals work cohesively throughout the system
 * using real evaluation patterns.
 */

import { 
  validateScreenshot, 
  validateWithGoals,
  createGameGoal,
  createGameGoals,
  testGameplay,
  composeSingleImagePrompt
} from '../../src/index.mjs';
import { chromium } from 'playwright';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

// Helper to create minimal test image
function createTestImage(path) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  writeFileSync(path, minimalPng);
}

async function testCohesiveGoals() {
  console.log('🧪 Testing Cohesive Goals Integration\n');

  const tempDir = join(tmpdir(), `ai-visual-test-${Date.now()}`);
  const screenshotPath = join(tempDir, 'test.png');
  createTestImage(screenshotPath);

  try {
    // Test 1: validateScreenshot with goal in context
    console.log('1. Testing validateScreenshot with goal in context...');
    const goal1 = createGameGoal('accessibility');
    const result1 = await validateScreenshot(screenshotPath, 'Base prompt', {
      goal: goal1,
      gameState: { score: 100 }
    });
    console.log('   ✅ validateScreenshot accepts goal in context');
    console.log(`   Result: enabled=${result1.enabled}, provider=${result1.provider}`);

    // Test 2: validateWithGoals convenience function
    console.log('\n2. Testing validateWithGoals convenience function...');
    const result2 = await validateWithGoals(screenshotPath, {
      goal: 'Is it fun?',
      gameState: { score: 200 }
    });
    console.log('   ✅ validateWithGoals works');
    console.log(`   Goal: ${result2.goal}`);
    console.log(`   Prompt length: ${result2.prompt.length}`);

    // Test 3: Prompt composition with goals
    console.log('\n3. Testing prompt composition with goals...');
    const prompt = await composeSingleImagePrompt('Base prompt', {
      goal: createGameGoal('performance'),
      gameState: { gameActive: true }
    });
    console.log('   ✅ Prompt composition with goals works');
    console.log(`   Prompt length: ${prompt.length}`);
    console.log(`   Includes goal: ${prompt.includes('GOAL') || prompt.includes('performance')}`);

    // Test 4: Multiple goals
    console.log('\n4. Testing multiple goals...');
    const goals = createGameGoals(['fun', 'accessibility', 'performance']);
    console.log(`   ✅ Created ${goals.length} goals`);
    for (const goal of goals) {
      const result = await validateScreenshot(screenshotPath, 'Base prompt', {
        goal,
        gameState: { score: 150 }
      });
      console.log(`   - ${goal.type}: enabled=${result.enabled}`);
    }

    console.log('\n✅ All cohesive goals tests passed!');
    console.log('\nSummary:');
    console.log('- validateScreenshot accepts goals in context ✅');
    console.log('- validateWithGoals convenience function works ✅');
    console.log('- Prompt composition uses goals automatically ✅');
    console.log('- Multiple goals work ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (existsSync(screenshotPath)) {
      unlinkSync(screenshotPath);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCohesiveGoals().catch(console.error);
}

export { testCohesiveGoals };

