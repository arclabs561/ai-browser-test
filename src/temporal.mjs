/**
 * Temporal Aggregator
 * 
 * Aggregates opinions over time with coherence checking.
 * Based on research: temporal aggregation, opinion propagation, coherence analysis.
 */

/**
 * Aggregate notes temporally with coherence analysis
 */
export function aggregateTemporalNotes(notes, options = {}) {
  const {
    windowSize = 10000, // 10 second windows
    decayFactor = 0.9, // Exponential decay for older notes
    coherenceThreshold = 0.7 // Minimum coherence score
  } = options;

  // Filter gameplay notes and sort by timestamp
  const gameplayNotes = notes
    .filter(n => n.step?.startsWith('gameplay_note_') || n.timestamp)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  if (gameplayNotes.length === 0) {
    return {
      windows: [],
      summary: 'No gameplay notes available',
      coherence: 1.0,
      conflicts: []
    };
  }

  // Group notes into temporal windows
  const windows = [];
  const startTime = gameplayNotes[0].timestamp || Date.now();
  
  for (let i = 0; i < gameplayNotes.length; i++) {
    const note = gameplayNotes[i];
    const elapsed = note.elapsed || (note.timestamp - startTime);
    const windowIndex = Math.floor(elapsed / windowSize);
    
    if (!windows[windowIndex]) {
      windows[windowIndex] = {
        index: windowIndex,
        startTime: startTime + (windowIndex * windowSize),
        endTime: startTime + ((windowIndex + 1) * windowSize),
        notes: [],
        weightedScore: 0,
        totalWeight: 0
      };
    }
    
    // Calculate weight (exponential decay)
    const age = elapsed;
    const weight = Math.pow(decayFactor, age / windowSize);
    
    windows[windowIndex].notes.push({
      ...note,
      weight
    });
    
    // Extract score from gameState if available
    const score = note.gameState?.score || note.score || 0;
    windows[windowIndex].weightedScore += score * weight;
    windows[windowIndex].totalWeight += weight;
  }

  // Calculate window summaries
  const windowSummaries = windows.map(window => {
    const avgScore = window.totalWeight > 0 
      ? window.weightedScore / window.totalWeight 
      : 0;
    
    const observations = window.notes.map(n => n.observation || n.assessment || '').join('; ');
    
    return {
      window: window.index,
      timeRange: `${Math.round((window.startTime - startTime) / 1000)}s-${Math.round((window.endTime - startTime) / 1000)}s`,
      noteCount: window.notes.length,
      avgScore: Math.round(avgScore),
      observations,
      weightedAvg: window.totalWeight > 0 ? window.weightedScore / window.totalWeight : 0
    };
  });

  // Coherence analysis: Check for logical progression
  const coherence = calculateCoherence(windowSummaries);
  const conflicts = detectConflicts(windowSummaries);

  // Generate summary
  const summary = generateSummary(windowSummaries, coherence, conflicts);

  return {
    windows: windowSummaries,
    summary,
    coherence,
    conflicts,
    totalNotes: gameplayNotes.length,
    timeSpan: gameplayNotes[gameplayNotes.length - 1].elapsed - gameplayNotes[0].elapsed
  };
}

/**
 * Calculate coherence score (0-1)
 */
function calculateCoherence(windows) {
  if (windows.length < 2) return 1.0;

  // Check for consistent trends (score progression)
  const scores = windows.map(w => w.avgScore);
  const trends = [];
  
  for (let i = 1; i < scores.length; i++) {
    const change = scores[i] - scores[i - 1];
    trends.push(change >= 0 ? 1 : -1); // Direction only
  }

  // Metric 1: Direction consistency
  let directionChanges = 0;
  for (let i = 1; i < trends.length; i++) {
    if (trends[i] !== trends[i - 1]) {
      directionChanges++;
    }
  }
  const directionConsistency = 1.0 - (directionChanges / Math.max(1, trends.length));

  // Metric 2: Score variance
  const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / scores.length;
  const maxVariance = Math.pow(meanScore, 2);
  const varianceCoherence = Math.max(0, 1.0 - (variance / Math.max(1, maxVariance)));

  // Metric 3: Observation consistency
  let observationConsistency = 1.0;
  if (windows.length > 1) {
    const observations = windows.map(w => (w.observations || '').toLowerCase());
    const keywords = observations.map(obs => {
      const words = obs.split(/\s+/).filter(w => w.length > 3);
      return new Set(words);
    });
    
    let overlapSum = 0;
    for (let i = 1; i < keywords.length; i++) {
      const prev = keywords[i - 1];
      const curr = keywords[i];
      if (prev && curr && prev.size > 0 && curr.size > 0) {
      const intersection = new Set([...prev].filter(x => curr.has(x)));
      const union = new Set([...prev, ...curr]);
      const overlap = union.size > 0 ? intersection.size / union.size : 0;
      overlapSum += overlap;
      }
    }
    observationConsistency = overlapSum / Math.max(1, keywords.length - 1);
  }

  // Weighted combination
  const coherence = (
    directionConsistency * 0.4 +
    varianceCoherence * 0.3 +
    observationConsistency * 0.3
  );
  
  return Math.max(0, Math.min(1, coherence));
}

/**
 * Detect conflicting opinions
 */
function detectConflicts(windows) {
  const conflicts = [];
  
  const observations = windows.map(w => (w.observations || '').toLowerCase());
  
  const positiveWords = ['good', 'great', 'excellent', 'smooth', 'responsive', 'clear'];
  const negativeWords = ['bad', 'poor', 'slow', 'laggy', 'unclear', 'confusing'];
  
  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i] || '';
    const hasPositive = positiveWords.some(w => obs.includes(w));
    const hasNegative = negativeWords.some(w => obs.includes(w));
    
    if (hasPositive && hasNegative) {
      conflicts.push({
        window: windows[i].window,
        type: 'mixed_sentiment',
        observation: windows[i].observations
      });
    }
  }
  
  // Check for score inconsistencies
  for (let i = 1; i < windows.length; i++) {
    if (windows[i] && windows[i - 1] && 
        windows[i].avgScore !== undefined && windows[i - 1].avgScore !== undefined &&
        windows[i].avgScore < windows[i - 1].avgScore) {
      conflicts.push({
        window: windows[i].window,
        type: 'score_decrease',
        previousScore: windows[i - 1].avgScore,
        currentScore: windows[i].avgScore
      });
    }
  }
  
  return conflicts;
}

/**
 * Generate human-readable summary
 */
function generateSummary(windows, coherence, conflicts) {
  const parts = [];
  
  parts.push(`Aggregated ${windows.length} temporal windows from gameplay notes.`);
  
  if (windows.length > 0) {
    const firstWindow = windows[0];
    const lastWindow = windows[windows.length - 1];
    const firstScore = firstWindow?.avgScore ?? 0;
    const lastScore = lastWindow?.avgScore ?? 0;
    parts.push(`Score progression: ${firstScore} → ${lastScore} (${lastScore - firstScore > 0 ? '+' : ''}${lastScore - firstScore}).`);
  }
  
  parts.push(`Temporal coherence: ${(coherence * 100).toFixed(0)}% ${coherence > 0.7 ? '(high)' : coherence > 0.4 ? '(moderate)' : '(low)'}.`);
  
  if (conflicts.length > 0) {
    parts.push(`Detected ${conflicts.length} potential conflict${conflicts.length > 1 ? 's' : ''}: ${conflicts.map(c => c.type).join(', ')}.`);
  }
  
  return parts.join(' ');
}

/**
 * Format aggregated notes for VLLM prompt
 */
export function formatNotesForPrompt(aggregated) {
  const parts = [];
  
  parts.push('TEMPORAL AGGREGATION ANALYSIS:');
  parts.push(aggregated.summary);
  parts.push('');
  
  if (aggregated.windows.length > 0) {
    parts.push('Temporal Windows:');
    aggregated.windows.forEach(window => {
      parts.push(`  [${window.timeRange}] Score: ${window.avgScore}, Notes: ${window.noteCount}`);
      if (window.observations) {
        parts.push(`    Observations: ${window.observations.substring(0, 100)}${window.observations.length > 100 ? '...' : ''}`);
      }
    });
    parts.push('');
  }
  
  if (aggregated.conflicts.length > 0) {
    parts.push('Coherence Issues:');
    aggregated.conflicts.forEach(conflict => {
      parts.push(`  - ${conflict.type}: ${JSON.stringify(conflict)}`);
    });
    parts.push('');
  }
  
  parts.push(`Overall Coherence: ${(aggregated.coherence * 100).toFixed(0)}%`);
  
  return parts.join('\n');
}

/**
 * Calculate coherence (exported for testing)
 * This is the same as the internal function, exported for external use
 */
export function calculateCoherenceExported(windows) {
  return calculateCoherence(windows);
}

