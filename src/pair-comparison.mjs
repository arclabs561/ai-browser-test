/**
 * Pair Comparison Evaluation
 * 
 * Implements pairwise comparison evaluation method.
 * Research shows Pair Comparison is more reliable than absolute scoring
 * (MLLM-as-a-Judge, arXiv:2402.04788).
 * 
 * Instead of scoring each screenshot independently, compares pairs
 * to determine which is better, then derives relative scores.
 */

import { VLLMJudge } from './judge.mjs';
import { detectBias, detectPositionBias } from './bias-detector.mjs';

/**
 * Compare two screenshots and determine which is better
 * 
 * @param {string} imagePath1 - Path to first screenshot
 * @param {string} imagePath2 - Path to second screenshot
 * @param {string} prompt - Evaluation prompt describing what to compare
 * @param {import('./index.mjs').ValidationContext} [context={}] - Validation context
 * @returns {Promise<import('./index.mjs').PairComparisonResult>} Comparison result
 */
export async function comparePair(imagePath1, imagePath2, prompt, context = {}) {
  const judge = new VLLMJudge(context);
  
  if (!judge.enabled) {
    return {
      enabled: false,
      winner: null,
      confidence: null,
      reasoning: 'VLLM validation is disabled',
      comparison: null
    };
  }
  
  const comparisonPrompt = buildComparisonPrompt(prompt, context);
  
  // Randomize order to reduce position bias
  const [first, second, order] = Math.random() > 0.5
    ? [imagePath1, imagePath2, 'original']
    : [imagePath2, imagePath1, 'reversed'];
  
  const fullPrompt = `${comparisonPrompt}

You are comparing two screenshots. Screenshot A is shown first, then Screenshot B.

SCREENSHOT A:
[First screenshot will be provided]

SCREENSHOT B:
[Second screenshot will be provided]

Compare them and determine which is better based on the evaluation criteria. Return JSON:
{
  "winner": "A" | "B" | "tie",
  "confidence": 0.0-1.0,
  "reasoning": "explanation of comparison",
  "differences": ["key difference 1", "key difference 2"],
  "scores": {
    "A": 0-10,
    "B": 0-10
  }
}`;
  
  try {
    // For pair comparison, we need to send both images
    // This is a simplified version - in practice, you'd need multi-image support
    // For now, we'll do two separate evaluations and compare
    
    const result1 = await judge.judgeScreenshot(first, comparisonPrompt, {
      ...context,
      comparisonContext: { position: 'A', total: 2 }
    });
    
    const result2 = await judge.judgeScreenshot(second, comparisonPrompt, {
      ...context,
      comparisonContext: { position: 'B', total: 2 }
    });
    
    // Determine winner based on scores
    const score1 = result1.score ?? 0;
    const score2 = result2.score ?? 0;
    
    let winner = 'tie';
    let confidence = 0.5;
    
    if (Math.abs(score1 - score2) < 0.5) {
      winner = 'tie';
      confidence = 0.5;
    } else if (score1 > score2) {
      winner = order === 'original' ? 'A' : 'B';
      confidence = Math.min(1.0, 0.5 + Math.abs(score1 - score2) / 10);
    } else {
      winner = order === 'original' ? 'B' : 'A';
      confidence = Math.min(1.0, 0.5 + Math.abs(score1 - score2) / 10);
    }
    
    // Detect position bias
    const positionBias = detectPositionBias([
      { score: score1 },
      { score: score2 }
    ]);
    
    // Adjust for position bias if detected
    if (positionBias.detected) {
      // Swap winner if position bias detected and scores are close
      if (Math.abs(score1 - score2) < 1.0) {
        winner = winner === 'A' ? 'B' : winner === 'B' ? 'A' : 'tie';
        confidence = Math.max(0.3, confidence - 0.2);
      }
    }
    
    return {
      enabled: true,
      winner: order === 'reversed' ? (winner === 'A' ? 'B' : winner === 'B' ? 'A' : 'tie') : winner,
      confidence,
      reasoning: `Screenshot ${winner === 'A' ? '1' : winner === 'B' ? '2' : 'neither'} is better. Score difference: ${Math.abs(score1 - score2).toFixed(2)}`,
      comparison: {
        score1,
        score2,
        difference: Math.abs(score1 - score2),
        order: order === 'reversed' ? 'reversed' : 'original'
      },
      biasDetection: {
        positionBias: positionBias.detected,
        adjusted: positionBias.detected
      },
      metadata: {
        provider: result1.provider,
        cached: result1.cached && result2.cached,
        responseTime: (result1.responseTime || 0) + (result2.responseTime || 0),
        estimatedCost: {
          totalCost: (result1.estimatedCost?.totalCost || 0) + (result2.estimatedCost?.totalCost || 0)
        }
      }
    };
  } catch (error) {
    return {
      enabled: false,
      winner: null,
      confidence: null,
      reasoning: `Comparison failed: ${error.message}`,
      comparison: null,
      error: error.message
    };
  }
}

/**
 * Build comparison prompt from base prompt
 */
function buildComparisonPrompt(basePrompt, context) {
  return `Compare the two screenshots based on the following criteria:

${basePrompt}

Focus on:
- Which screenshot better meets the criteria?
- What are the key differences?
- Which has fewer issues?
- Which provides better user experience?

Be specific about what makes one better than the other.`;
}

/**
 * Rank multiple screenshots using pairwise comparisons
 * Uses tournament-style ranking
 * 
 * @param {Array<string>} imagePaths - Array of screenshot paths
 * @param {string} prompt - Evaluation prompt
 * @param {import('./index.mjs').ValidationContext} [context={}] - Validation context
 * @returns {Promise<import('./index.mjs').BatchRankingResult>} Ranking result
 */
export async function rankBatch(imagePaths, prompt, context = {}) {
  if (imagePaths.length < 2) {
    return {
      enabled: false,
      rankings: [],
      error: 'Need at least 2 screenshots for ranking'
    };
  }
  
  // For efficiency, compare each pair
  // In practice, you might use a tournament bracket or sampling
  const comparisons = [];
  const scores = new Map();
  
  // Compare all pairs
  for (let i = 0; i < imagePaths.length; i++) {
    for (let j = i + 1; j < imagePaths.length; j++) {
      const comparison = await comparePair(
        imagePaths[i],
        imagePaths[j],
        prompt,
        context
      );
      
      if (comparison.enabled && comparison.winner !== 'tie') {
        comparisons.push({
          image1: i,
          image2: j,
          winner: comparison.winner === 'A' ? i : j,
          confidence: comparison.confidence
        });
        
        // Update scores based on wins
        const winnerIdx = comparison.winner === 'A' ? i : j;
        const loserIdx = comparison.winner === 'A' ? j : i;
        
        scores.set(winnerIdx, (scores.get(winnerIdx) || 0) + comparison.confidence);
        scores.set(loserIdx, (scores.get(loserIdx) || 0) + (1 - comparison.confidence));
      }
    }
  }
  
  // Rank by scores
  const rankings = Array.from(scores.entries())
    .map(([idx, score]) => ({
      index: idx,
      path: imagePaths[idx],
      score,
      wins: comparisons.filter(c => c.winner === idx).length
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, rank) => ({
      ...r,
      rank: rank + 1
    }));
  
  return {
    enabled: true,
    rankings,
    comparisons: comparisons.length,
    metadata: {
      totalScreenshots: imagePaths.length,
      totalComparisons: comparisons.length
    }
  };
}

