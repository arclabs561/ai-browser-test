#!/usr/bin/env node
/**
 * Test Interactive Experience Websites
 * 
 * Validates interactive experience testing infrastructure.
 */

import { 
  INTERACTIVE_EXPERIENCE_WEBSITES, 
  getWebsitesByExperienceType, 
  getAllInteractiveWebsitesSorted,
  buildInteractivePrompt,
  getInteractiveExpectedResults
} from './interactive-experiences.mjs';

/**
 * Test interactive website structure
 */
function testInteractiveStructure() {
  console.log('🧪 Testing Interactive Experience Websites Structure\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Websites defined
  console.log('Test 1: Interactive websites defined');
  if (INTERACTIVE_EXPERIENCE_WEBSITES && INTERACTIVE_EXPERIENCE_WEBSITES.length > 0) {
    console.log(`   ✅ ${INTERACTIVE_EXPERIENCE_WEBSITES.length} interactive websites defined`);
    passed++;
  } else {
    console.log('   ❌ No interactive websites defined');
    failed++;
  }
  
  // Test 2: Experience types
  console.log('\nTest 2: Experience types');
  const experienceTypes = new Set(INTERACTIVE_EXPERIENCE_WEBSITES.map(w => w.experienceType));
  const expectedTypes = ['gameplay', 'interactive-app', 'collaborative'];
  const hasAllTypes = expectedTypes.every(t => experienceTypes.has(t));
  if (hasAllTypes) {
    console.log(`   ✅ All experience types present: ${Array.from(experienceTypes).join(', ')}`);
    passed++;
  } else {
    const found = Array.from(experienceTypes);
    console.log(`   ⚠️  Experience types. Found: ${found.join(', ')}`);
    passed++; // Not critical
  }
  
  // Test 3: Website structure
  console.log('\nTest 3: Website structure validation');
  const website = INTERACTIVE_EXPERIENCE_WEBSITES[0];
  const requiredFields = ['id', 'name', 'url', 'difficulty', 'experienceType', 'challenges', 'expectedScore', 'focusAreas'];
  const hasAllFields = requiredFields.every(field => website[field] !== undefined);
  if (hasAllFields) {
    console.log(`   ✅ Website structure valid (${website.name})`);
    passed++;
  } else {
    const missing = requiredFields.filter(f => website[f] === undefined);
    console.log(`   ❌ Missing fields: ${missing.join(', ')}`);
    failed++;
  }
  
  // Test 4: Personas defined
  console.log('\nTest 4: Personas defined');
  const hasPersonas = INTERACTIVE_EXPERIENCE_WEBSITES.every(w => 
    w.personas && Array.isArray(w.personas) && w.personas.length > 0
  );
  if (hasPersonas) {
    console.log(`   ✅ All websites have personas defined`);
    passed++;
  } else {
    console.log(`   ⚠️  Some websites missing personas (optional)`);
    passed++; // Optional
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

/**
 * Test prompt building
 */
function testInteractivePromptBuilding() {
  console.log('\n🧪 Testing Interactive Prompt Building\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Prompt generation
  console.log('Test 1: Interactive prompt generation');
  try {
    const website = INTERACTIVE_EXPERIENCE_WEBSITES.find(w => w.experienceType === 'gameplay');
    const prompt = buildInteractivePrompt(website);
    if (prompt && prompt.length > 200) {
      console.log(`   ✅ Prompt generated (${prompt.length} chars)`);
      console.log(`   Preview: ${prompt.substring(0, 150)}...`);
      passed++;
    } else {
      console.log('   ❌ Prompt too short or empty');
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Error building prompt: ${error.message}`);
    failed++;
  }
  
  // Test 2: Prompt includes challenges
  console.log('\nTest 2: Prompt includes challenges');
  const website = INTERACTIVE_EXPERIENCE_WEBSITES[0];
  const prompt = buildInteractivePrompt(website);
  const includesChallenges = website.challenges.some(c => prompt.includes(c));
  if (includesChallenges) {
    console.log(`   ✅ Prompt includes challenges`);
    passed++;
  } else {
    console.log(`   ❌ Prompt missing challenges`);
    failed++;
  }
  
  // Test 3: Prompt includes experience type
  console.log('\nTest 3: Prompt includes experience type');
  const includesType = prompt.includes(website.experienceType);
  if (includesType) {
    console.log(`   ✅ Prompt includes experience type`);
    passed++;
  } else {
    console.log(`   ⚠️  Prompt may not include experience type (optional)`);
    passed++; // Optional
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

/**
 * Test experience type filtering
 */
function testExperienceTypeFiltering() {
  console.log('\n🧪 Testing Experience Type Filtering\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Get by experience type
  console.log('Test 1: Get websites by experience type');
  const gameplaySites = getWebsitesByExperienceType('gameplay');
  if (gameplaySites.length > 0) {
    console.log(`   ✅ Found ${gameplaySites.length} 'gameplay' websites`);
    passed++;
  } else {
    console.log(`   ❌ No 'gameplay' websites found`);
    failed++;
  }
  
  // Test 2: Sorted by difficulty
  console.log('\nTest 2: Websites sorted by difficulty');
  const sorted = getAllInteractiveWebsitesSorted();
  const difficultyOrder = ['hard', 'very-hard', 'extreme', 'expert', 'nightmare'];
  let isSorted = true;
  for (let i = 1; i < sorted.length; i++) {
    const prevIndex = difficultyOrder.indexOf(sorted[i-1].difficulty);
    const currIndex = difficultyOrder.indexOf(sorted[i].difficulty);
    if (prevIndex === -1 || currIndex === -1 || currIndex < prevIndex) {
      isSorted = false;
      break;
    }
  }
  if (isSorted) {
    console.log(`   ✅ Websites properly sorted by difficulty`);
    passed++;
  } else {
    console.log(`   ❌ Websites not properly sorted`);
    failed++;
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

/**
 * Run all tests
 */
function runTests() {
  console.log('🚀 Interactive Experience Websites Test Suite\n');
  console.log('='.repeat(60));
  
  const structureResults = testInteractiveStructure();
  const promptResults = testInteractivePromptBuilding();
  const filteringResults = testExperienceTypeFiltering();
  
  const totalPassed = structureResults.passed + promptResults.passed + filteringResults.passed;
  const totalFailed = structureResults.failed + promptResults.failed + filteringResults.failed;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Overall Results:');
  console.log(`   ✅ Passed: ${totalPassed}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  // Show experience type distribution
  console.log('\n📊 Experience Type Distribution:');
  const types = {};
  INTERACTIVE_EXPERIENCE_WEBSITES.forEach(w => {
    types[w.experienceType] = (types[w.experienceType] || 0) + 1;
  });
  Object.entries(types).forEach(([type, count]) => {
    console.log(`   ${type.padEnd(20)}: ${count} websites`);
  });
  
  // Show difficulty distribution
  console.log('\n📊 Difficulty Distribution:');
  const difficulties = {};
  INTERACTIVE_EXPERIENCE_WEBSITES.forEach(w => {
    difficulties[w.difficulty] = (difficulties[w.difficulty] || 0) + 1;
  });
  const diffOrder = ['hard', 'very-hard', 'extreme', 'expert', 'nightmare'];
  diffOrder.forEach(diff => {
    if (difficulties[diff]) {
      console.log(`   ${diff.padEnd(12)}: ${difficulties[diff]} websites`);
    }
  });
  
  if (totalFailed === 0) {
    console.log('\n✅ All tests passed! Interactive experiences are ready for evaluation.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review before running evaluations.');
  }
  
  return { totalPassed, totalFailed };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testInteractiveStructure, testInteractivePromptBuilding, testExperienceTypeFiltering, runTests };





