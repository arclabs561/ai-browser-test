/**
 * Test Adaptive Window Sizing
 * 
 * Tests different window sizes (5s, 10s, 20s, 30s) to measure impact on coherence
 * and identify optimal window sizes for different activity types.
 */

import { aggregateTemporalNotes } from '../src/temporal.mjs';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate test notes with different patterns
 */
function generateTestNotes(pattern, count = 20) {
  const patterns = {
    consistent: Array.from({ length: count }, (_, i) => ({
      timestamp: i * 1000, // 1 second apart
      gameState: { score: i * 10 },
      observation: `Score increasing: ${i * 10}`
    })),
    erratic: Array.from({ length: count }, (_, i) => ({
      timestamp: i * 1000,
      gameState: { score: i % 2 === 0 ? i * 10 : (i - 1) * 5 }, // Alternating
      observation: i % 2 === 0 ? 'Score up' : 'Score down'
    })),
    slowChange: Array.from({ length: count }, (_, i) => ({
      timestamp: i * 2000, // 2 seconds apart
      gameState: { score: Math.floor(i / 2) * 10 },
      observation: `Gradual change: ${Math.floor(i / 2) * 10}`
    })),
    fastChange: Array.from({ length: count }, (_, i) => ({
      timestamp: i * 500, // 0.5 seconds apart
      gameState: { score: i * 5 },
      observation: `Quick change: ${i * 5}`
    }))
  };
  
  return patterns[pattern] || patterns.consistent;
}

/**
 * Test window size impact on different note patterns
 */
function testWindowSizeImpact() {
  const windowSizes = [5000, 10000, 20000, 30000]; // 5s, 10s, 20s, 30s
  const patterns = ['consistent', 'erratic', 'slowChange', 'fastChange'];
  
  const results = {};
  
  for (const pattern of patterns) {
    const notes = generateTestNotes(pattern);
    results[pattern] = {};
    
    for (const windowSize of windowSizes) {
      const aggregated = aggregateTemporalNotes(notes, {
        windowSize,
        decayFactor: 0.9
      });
      
      results[pattern][`${windowSize}ms`] = {
        windows: aggregated.windows.length,
        coherence: aggregated.coherence,
        conflicts: aggregated.conflicts.length,
        summary: aggregated.summary.substring(0, 100)
      };
    }
  }
  
  return {
    name: 'Window Size Impact Analysis',
    results,
    analysis: {
      optimalWindows: {},
      coherenceVariation: {},
      windowCountVariation: {}
    }
  };
}

/**
 * Analyze optimal window sizes
 */
function analyzeOptimalWindows(results) {
  const analysis = {
    optimalWindows: {},
    recommendations: []
  };
  
  for (const [pattern, windowResults] of Object.entries(results)) {
    // Find window size with highest coherence for consistent patterns
    // Find window size with lowest coherence for erratic patterns (correctly identifies)
    let bestWindow = null;
    let bestCoherence = pattern === 'erratic' ? 1.0 : 0.0;
    
    for (const [windowSize, data] of Object.entries(windowResults)) {
      if (pattern === 'erratic') {
        // For erratic, lower coherence is better (correctly identifies problem)
        if (data.coherence < bestCoherence) {
          bestCoherence = data.coherence;
          bestWindow = windowSize;
        }
      } else {
        // For consistent, higher coherence is better
        if (data.coherence > bestCoherence) {
          bestCoherence = data.coherence;
          bestWindow = windowSize;
        }
      }
    }
    
    analysis.optimalWindows[pattern] = {
      bestWindow,
      coherence: bestCoherence,
      allResults: windowResults
    };
    
    // Generate recommendation
    if (pattern === 'fastChange') {
      analysis.recommendations.push({
        pattern: 'fastChange',
        recommendation: 'Fast-changing patterns may benefit from smaller windows (5s)',
        evidence: `Best coherence with ${bestWindow}`
      });
    } else if (pattern === 'slowChange') {
      analysis.recommendations.push({
        pattern: 'slowChange',
        recommendation: 'Slow-changing patterns may benefit from larger windows (20s-30s)',
        evidence: `Best coherence with ${bestWindow}`
      });
    }
  }
  
  return analysis;
}

/**
 * Test adaptive window sizing based on note frequency
 */
function testAdaptiveWindowSizing() {
  // Test with varying note frequencies
  const scenarios = [
    {
      name: 'High Frequency',
      notes: Array.from({ length: 30 }, (_, i) => ({
        timestamp: i * 500, // 0.5s apart = 15 seconds total
        gameState: { score: i * 5 },
        observation: `Frame ${i}`
      })),
      expectedWindow: 5000 // Should use smaller window for high frequency
    },
    {
      name: 'Low Frequency',
      notes: Array.from({ length: 10 }, (_, i) => ({
        timestamp: i * 3000, // 3s apart = 30 seconds total
        gameState: { score: i * 10 },
        observation: `Frame ${i}`
      })),
      expectedWindow: 20000 // Should use larger window for low frequency
    },
    {
      name: 'Mixed Frequency',
      notes: [
        ...Array.from({ length: 5 }, (_, i) => ({
          timestamp: i * 500, // Fast at start
          gameState: { score: i * 5 },
          observation: `Fast ${i}`
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          timestamp: 5000 + i * 3000, // Slow later
          gameState: { score: 25 + i * 10 },
          observation: `Slow ${i}`
        }))
      ],
      expectedWindow: 10000 // Mixed - use medium window
    }
  ];
  
  const results = scenarios.map(scenario => {
    // Calculate note frequency
    const timeSpan = scenario.notes[scenario.notes.length - 1].timestamp - scenario.notes[0].timestamp;
    const frequency = scenario.notes.length / (timeSpan / 1000); // notes per second
    
    // Adaptive window sizing logic
    let adaptiveWindow;
    if (frequency > 2) {
      adaptiveWindow = 5000; // High frequency: small window
    } else if (frequency < 0.5) {
      adaptiveWindow = 20000; // Low frequency: large window
    } else {
      adaptiveWindow = 10000; // Medium frequency: default window
    }
    
    // Test with adaptive window
    const aggregated = aggregateTemporalNotes(scenario.notes, {
      windowSize: adaptiveWindow,
      decayFactor: 0.9
    });
    
    // Test with fixed window for comparison
    const fixedAggregated = aggregateTemporalNotes(scenario.notes, {
      windowSize: 10000,
      decayFactor: 0.9
    });
    
    return {
      name: scenario.name,
      frequency: frequency.toFixed(2),
      adaptiveWindow,
      fixedWindow: 10000,
      adaptive: {
        windows: aggregated.windows.length,
        coherence: aggregated.coherence
      },
      fixed: {
        windows: fixedAggregated.windows.length,
        coherence: fixedAggregated.coherence
      },
      improvement: aggregated.coherence - fixedAggregated.coherence
    };
  });
  
  return {
    name: 'Adaptive Window Sizing',
    results,
    recommendation: 'Consider adaptive window sizing based on note frequency'
  };
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🔬 Testing Adaptive Window Sizing\n');
  
  // Test 1: Window size impact
  console.log('1. Testing window size impact on different patterns...\n');
  const impactResults = testWindowSizeImpact();
  const analysis = analyzeOptimalWindows(impactResults.results);
  
  console.log('Window Size Impact Results:');
  for (const [pattern, data] of Object.entries(impactResults.results)) {
    console.log(`\n${pattern}:`);
    for (const [windowSize, result] of Object.entries(data)) {
      console.log(`  ${windowSize}ms: ${result.windows} windows, coherence ${result.coherence.toFixed(3)}, ${result.conflicts} conflicts`);
    }
  }
  
  console.log('\n\nOptimal Windows Analysis:');
  for (const [pattern, optimal] of Object.entries(analysis.optimalWindows)) {
    console.log(`\n${pattern}:`);
    console.log(`  Best window: ${optimal.bestWindow}`);
    console.log(`  Coherence: ${optimal.coherence.toFixed(3)}`);
  }
  
  if (analysis.recommendations.length > 0) {
    console.log('\n\nRecommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`  - ${rec.pattern}: ${rec.recommendation}`);
      console.log(`    Evidence: ${rec.evidence}`);
    });
  }
  
  // Test 2: Adaptive window sizing
  console.log('\n\n2. Testing adaptive window sizing...\n');
  const adaptiveResults = testAdaptiveWindowSizing();
  
  console.log('Adaptive Window Sizing Results:');
  adaptiveResults.results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Frequency: ${result.frequency} notes/sec`);
    console.log(`  Adaptive window: ${result.adaptiveWindow}ms (${result.adaptive.windows} windows, coherence ${result.adaptive.coherence.toFixed(3)})`);
    console.log(`  Fixed window: ${result.fixedWindow}ms (${result.fixed.windows} windows, coherence ${result.fixed.coherence.toFixed(3)})`);
    console.log(`  Improvement: ${(result.improvement * 100).toFixed(1)}%`);
  });
  
  // Save results
  const output = {
    timestamp: new Date().toISOString(),
    windowSizeImpact: impactResults,
    optimalWindows: analysis,
    adaptiveWindowSizing: adaptiveResults
  };
  
  const outputPath = join(process.cwd(), 'evaluation', 'results', `adaptive-windows-${Date.now()}.json`);
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n\nResults saved to: ${outputPath}`);
  
  return output;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testWindowSizeImpact, testAdaptiveWindowSizing };


