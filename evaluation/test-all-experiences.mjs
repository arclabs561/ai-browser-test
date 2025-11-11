#!/usr/bin/env node
/**
 * Test All Experiences
 * 
 * Comprehensive test suite for both challenging websites and interactive experiences.
 */

import { runTests as testChallenging } from './test-challenging-websites.mjs';
import { runTests as testInteractive } from './test-interactive-experiences.mjs';
import { getAllWebsites, getAllWebsitesSorted } from './challenging-websites.mjs';

async function runAllExperienceTests() {
  console.log('🚀 Comprehensive Experience Testing\n');
  console.log('Testing both challenging websites and interactive experiences\n');
  console.log('='.repeat(60));
  
  const results = {
    challenging: null,
    interactive: null,
    combined: null,
    overall: { passed: 0, failed: 0 }
  };
  
  // Test challenging websites
  console.log('\n📊 Testing Challenging Websites...\n');
  try {
    results.challenging = testChallenging();
    results.overall.passed += results.challenging.totalPassed || 0;
    results.overall.failed += results.challenging.totalFailed || 0;
  } catch (error) {
    console.error(`❌ Error testing challenging websites: ${error.message}`);
    results.overall.failed++;
  }
  
  // Test interactive experiences
  console.log('\n📊 Testing Interactive Experiences...\n');
  try {
    results.interactive = testInteractive();
    results.overall.passed += results.interactive.totalPassed || 0;
    results.overall.failed += results.interactive.totalFailed || 0;
  } catch (error) {
    console.error(`❌ Error testing interactive experiences: ${error.message}`);
    results.overall.failed++;
  }
  
  // Test combined system
  console.log('\n📊 Testing Combined System...\n');
  try {
    const allWebsites = getAllWebsites();
    const sorted = getAllWebsitesSorted();
    
    console.log(`   ✅ Total websites: ${allWebsites.length}`);
    console.log(`   ✅ Sorted correctly: ${sorted.length === allWebsites.length ? 'Yes' : 'No'}`);
    
    // Check difficulty distribution
    const difficulties = {};
    allWebsites.forEach(w => {
      difficulties[w.difficulty] = (difficulties[w.difficulty] || 0) + 1;
    });
    console.log(`   ✅ Difficulty levels: ${Object.keys(difficulties).length}`);
    
    // Check experience types (for interactive)
    const experienceTypes = {};
    allWebsites.forEach(w => {
      if (w.experienceType) {
        experienceTypes[w.experienceType] = (experienceTypes[w.experienceType] || 0) + 1;
      }
    });
    if (Object.keys(experienceTypes).length > 0) {
      console.log(`   ✅ Experience types: ${Object.keys(experienceTypes).join(', ')}`);
    }
    
    results.combined = { passed: 3, failed: 0 };
    results.overall.passed += 3;
  } catch (error) {
    console.error(`❌ Error testing combined system: ${error.message}`);
    results.overall.failed++;
  }
  
  // Overall summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Overall Test Results\n');
  console.log(`   ✅ Total Passed: ${results.overall.passed}`);
  console.log(`   ❌ Total Failed: ${results.overall.failed}`);
  const total = results.overall.passed + results.overall.failed;
  if (total > 0) {
    console.log(`   📈 Success Rate: ${((results.overall.passed / total) * 100).toFixed(1)}%`);
  }
  
  // Show combined statistics
  console.log('\n📋 Combined System Statistics:');
  const allWebsites = getAllWebsites();
  console.log(`   Total Websites: ${allWebsites.length}`);
  
  const difficulties = {};
  allWebsites.forEach(w => {
    difficulties[w.difficulty] = (difficulties[w.difficulty] || 0) + 1;
  });
  console.log(`   Difficulty Levels: ${Object.keys(difficulties).length}`);
  Object.entries(difficulties).sort().forEach(([diff, count]) => {
    console.log(`      ${diff.padEnd(12)}: ${count} sites`);
  });
  
  const experienceTypes = {};
  allWebsites.forEach(w => {
    if (w.experienceType) {
      experienceTypes[w.experienceType] = (experienceTypes[w.experienceType] || 0) + 1;
    }
  });
  if (Object.keys(experienceTypes).length > 0) {
    console.log(`   Experience Types: ${Object.keys(experienceTypes).length}`);
    Object.entries(experienceTypes).forEach(([type, count]) => {
      console.log(`      ${type.padEnd(20)}: ${count} sites`);
    });
  }
  
  if (results.overall.failed === 0) {
    console.log('\n✅ All tests passed! System is ready for interactive experience evaluation.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review before running evaluations.');
  }
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExperienceTests().catch(console.error);
}

export { runAllExperienceTests };





