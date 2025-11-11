/**
 * Temporal Decision-Making
 * 
 * Implements research-aligned temporal decision-making for LLM evaluations:
 * - Multi-scale temporal aggregation (0.1s to 60s+)
 * - Sequential decision context
 * - Human perception time modeling
 * - Attention-based weighting
 * 
 * Based on research:
 * - Efficient Sequential Decision Making (arXiv:2406.12125)
 * - Human Time Perception (PMC research)
 * - Powers of 10: Time Scales in UX (NN/g)
 * 
 * @module temporal-decision
 */

import {
  TIME_SCALES,
  MULTI_SCALE_WINDOWS,
  READING_SPEEDS,
  ATTENTION_MULTIPLIERS,
  COMPLEXITY_MULTIPLIERS,
  CONFIDENCE_THRESHOLDS,
  TIME_BOUNDS,
  CONTENT_THRESHOLDS
} from './temporal-constants.mjs';
import { validateAndSortNotes, validateTimeScales, validateAction, validatePerceptionContext, validateSequentialContextOptions } from './temporal-validation.mjs';
import { MultiScaleError, PerceptionTimeError } from './temporal-errors.mjs';

/**
 * Multi-scale temporal aggregation
 * Uses multiple time scales to capture different aspects of human perception
 */
export function aggregateMultiScale(notes, options = {}) {
  // Validate and sort inputs
  const sortedNotes = validateAndSortNotes(notes);
  
  const {
    timeScales = MULTI_SCALE_WINDOWS,
    attentionWeights = true
  } = options;
  
  // Validate time scales
  validateTimeScales(timeScales);
  
  if (sortedNotes.length === 0) {
    return {
      scales: {},
      summary: 'No notes available',
      coherence: {}
    };
  }
  
  const startTime = sortedNotes[0].timestamp || Date.now();
  const scales = {};
  
  // Aggregate at each time scale
  for (const [scaleName, windowSize] of Object.entries(timeScales)) {
    const windows = [];
    
    for (const note of sortedNotes) {
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
      
      // Attention-based weighting
      const weight = attentionWeights
        ? calculateAttentionWeight(note, { elapsed, windowSize, scaleName })
        : 1.0;
      
      windows[windowIndex].notes.push({ ...note, weight });
      
      const score = note.gameState?.score || note.score || 0;
      windows[windowIndex].weightedScore += score * weight;
      windows[windowIndex].totalWeight += weight;
    }
    
    scales[scaleName] = {
      windowSize,
      windows: windows.map(w => ({
        window: w.index,
        timeRange: `${Math.round((w.startTime - startTime) / 1000)}s-${Math.round((w.endTime - startTime) / 1000)}s`,
        avgScore: w.totalWeight > 0 ? w.weightedScore / w.totalWeight : 0,
        noteCount: w.notes.length
      })),
      coherence: calculateCoherenceForScale(windows)
    };
  }
  
  return {
    scales,
    summary: generateMultiScaleSummary(scales),
    coherence: Object.fromEntries(
      Object.entries(scales).map(([name, scale]) => [name, scale.coherence])
    )
  };
}

/**
 * Calculate attention-based weight
 * Models how human attention affects temporal perception
 */
function calculateAttentionWeight(note, context) {
  const { elapsed, windowSize, scaleName } = context;
  
  // Base recency weight (exponential decay)
  const recencyWeight = Math.pow(0.9, elapsed / windowSize);
  
  // Salience weight (important events get more attention)
  const salienceWeight = calculateSalience(note);
  
  // Action weight (user actions focus attention)
  const actionWeight = note.step?.includes('interaction') || note.step?.includes('click')
    ? 1.5
    : 1.0;
  
  // Novelty weight (context changes attract attention)
  const noveltyWeight = note.observation?.includes('change') || note.observation?.includes('new')
    ? 1.3
    : 1.0;
  
  return recencyWeight * salienceWeight * actionWeight * noveltyWeight;
}

/**
 * Calculate salience (importance) of a note
 */
function calculateSalience(note) {
  let salience = 1.0;
  
  // High scores or low scores are more salient
  const score = note.score || note.gameState?.score || 5;
  if (score >= 8 || score <= 2) {
    salience *= 1.5;
  }
  
  // Issues mentioned increase salience
  if (note.issues && note.issues.length > 0) {
    salience *= 1.2;
  }
  
  // Critical keywords increase salience
  const criticalKeywords = ['error', 'broken', 'fail', 'critical', 'important'];
  const observation = (note.observation || '').toLowerCase();
  if (criticalKeywords.some(kw => observation.includes(kw))) {
    salience *= 1.3;
  }
  
  return salience;
}

/**
 * Calculate coherence for a specific time scale
 */
function calculateCoherenceForScale(windows) {
  if (windows.length < 2) return 1.0;
  
  const scores = windows.map(w => 
    w.totalWeight > 0 ? w.weightedScore / w.totalWeight : 0
  );
  
  // Direction consistency
  let directionChanges = 0;
  for (let i = 1; i < scores.length; i++) {
    const prevDir = scores[i - 1] >= scores[i - 2] ? 1 : -1;
    const currDir = scores[i] >= scores[i - 1] ? 1 : -1;
    if (prevDir !== currDir) directionChanges++;
  }
  const directionConsistency = 1.0 - (directionChanges / Math.max(1, scores.length - 1));
  
  // Variance coherence
  const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - meanScore, 2), 0) / scores.length;
  const maxVariance = Math.pow(meanScore, 2);
  const varianceCoherence = Math.max(0, 1.0 - (variance / Math.max(1, maxVariance)));
  
  return (directionConsistency * 0.6 + varianceCoherence * 0.4);
}

/**
 * Generate summary across multiple time scales
 */
function generateMultiScaleSummary(scales) {
  const parts = [];
  
  for (const [scaleName, scale] of Object.entries(scales)) {
    if (scale.windows.length > 0) {
      const first = scale.windows[0].avgScore;
      const last = scale.windows[scale.windows.length - 1].avgScore;
      parts.push(`${scaleName} scale (${scale.windowSize}ms): ${first.toFixed(1)} → ${last.toFixed(1)}, coherence: ${(scale.coherence * 100).toFixed(0)}%`);
    }
  }
  
  return parts.join('; ');
}

/**
 * Sequential Decision Context
 * Maintains context across LLM calls for better sequential decision-making
 */
export class SequentialDecisionContext {
  constructor(options = {}) {
    // Validate options
    validateSequentialContextOptions(options);
    
    this.history = [];
    this.currentState = null;
    this.adaptations = {};
    this.maxHistory = options.maxHistory || 10;
    this.adaptationEnabled = options.adaptationEnabled !== false;
  }
  
  /**
   * Add decision to history
   */
  addDecision(decision) {
    this.history.push({
      ...decision,
      timestamp: Date.now(),
      index: this.history.length
    });
    
    // Keep only recent history
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // Update current state
    this.currentState = decision;
  }
  
  /**
   * Adapt prompt based on history
   */
  adaptPrompt(basePrompt, currentContext) {
    if (!this.adaptationEnabled || this.history.length === 0) {
      return basePrompt;
    }
    
    // Identify patterns in history
    const patterns = this.identifyPatterns();
    
    // Build context from history
    const historyContext = this.buildHistoryContext(patterns);
    
    // Adapt prompt
    return `${basePrompt}

## Previous Evaluation Context:
${historyContext}

## Adaptation Instructions:
${this.buildAdaptationInstructions(patterns, currentContext)}`;
  }
  
  /**
   * Identify patterns in decision history
   */
  identifyPatterns() {
    if (this.history.length < 2) return {};
    
    const scores = this.history.map(d => d.score).filter(s => s !== null);
    const issues = this.history.flatMap(d => d.issues || []);
    
    // Trend pattern
    const trend = scores.length >= 2
      ? scores[scores.length - 1] > scores[scores.length - 2] ? 'improving' : 'declining'
      : 'stable';
    
    // Common issues
    const issueCounts = {};
    issues.forEach(issue => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });
    const commonIssues = Object.entries(issueCounts)
      .filter(([_, count]) => count >= 2)
      .map(([issue, _]) => issue);
    
    // Consistency
    const scoreVariance = scores.length > 1
      ? calculateVariance(scores)
      : 0;
    const isConsistent = scoreVariance < 2.0;
    
    return {
      trend,
      commonIssues,
      isConsistent,
      scoreVariance,
      recentScores: scores.slice(-3)
    };
  }
  
  /**
   * Build history context for prompt
   */
  buildHistoryContext(patterns) {
    const parts = [];
    
    if (this.history.length > 0) {
      const recent = this.history.slice(-3);
      parts.push(`Recent evaluations (${this.history.length} total):`);
      recent.forEach((d, i) => {
        parts.push(`  ${i + 1}. Score: ${d.score?.toFixed(1) || 'N/A'}/10, Issues: ${(d.issues || []).length}`);
      });
    }
    
    if (patterns.trend) {
      parts.push(`Trend: ${patterns.trend}`);
    }
    
    if (patterns.commonIssues.length > 0) {
      parts.push(`Recurring issues: ${patterns.commonIssues.join(', ')}`);
    }
    
    if (!patterns.isConsistent) {
      parts.push(`Warning: Inconsistent scores detected (variance: ${patterns.scoreVariance.toFixed(2)})`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * Build adaptation instructions
   * Data-driven: Adaptive confidence thresholds based on experimental findings
   * Research shows sequential context can increase variance if over-applied
   */
  buildAdaptationInstructions(patterns, currentContext) {
    const instructions = [];
    
    // Calculate confidence level based on variance and pattern strength
    const variance = patterns.scoreVariance || 0;
    const hasStrongPatterns = patterns.commonIssues.length > 0;
    const confidence = variance < CONFIDENCE_THRESHOLDS.HIGH_VARIANCE && hasStrongPatterns ? 'high' :
                      variance < CONFIDENCE_THRESHOLDS.MEDIUM_VARIANCE || hasStrongPatterns ? 'medium' : 'low';
    
    // Only add strong instructions when confidence is high (data shows over-correction)
    if (patterns.trend === 'declining' && confidence === 'high') {
      instructions.push('Previous evaluations showed declining quality. Pay special attention to issues.');
    } else if (patterns.trend === 'declining' && confidence === 'medium') {
      instructions.push('Previous evaluations showed a slight decline. Consider checking for issues.');
    }
    
    if (patterns.commonIssues.length > 0) {
      if (confidence === 'high') {
        instructions.push(`Look for these recurring issues: ${patterns.commonIssues.join(', ')}`);
      } else if (confidence === 'medium') {
        instructions.push(`These issues appeared in previous evaluations: ${patterns.commonIssues.join(', ')}. Consider checking for them.`);
      }
    }
    
    if (!patterns.isConsistent) {
      instructions.push('Previous evaluations were inconsistent. Be especially careful and thorough.');
    }
    
    // Always provide context but emphasize independence (data shows context can increase variance)
    // Use gentler language for lower confidence
    if (patterns.recentScores.length > 0) {
      const avgRecent = patterns.recentScores.reduce((a, b) => a + b, 0) / patterns.recentScores.length;
      if (confidence === 'high') {
        instructions.push(`Recent average score: ${avgRecent.toFixed(1)}/10. Use this as context but evaluate independently.`);
      } else {
        instructions.push(`Recent evaluations averaged ${avgRecent.toFixed(1)}/10. Evaluate independently based on current screenshot.`);
      }
    }
    
    return instructions.length > 0
      ? instructions.join('\n')
      : 'Evaluate independently, but consider previous context for consistency.';
  }
  
  /**
   * Get context for current decision
   */
  getContext() {
    return {
      historyLength: this.history.length,
      recentDecisions: this.history.slice(-3),
      patterns: this.identifyPatterns()
    };
  }
}

/**
 * Human Perception Time Modeling
 * Models human perception at different time scales
 * Based on research:
 * - 0.1s threshold for direct manipulation (NN/g)
 * - 50ms for visual appeal decisions (Lindgaard research)
 * - 200-300 words/minute reading speed
 * - Attention affects temporal perception
 */
export function humanPerceptionTime(action, context = {}) {
  // Validate inputs
  validateAction(action);
  validatePerceptionContext(context);
  
  const {
    persona = null,
    attentionLevel = 'normal',
    actionComplexity = 'normal',
    contentLength = 0
  } = context;
  
  // Base times from research (NN/g, PMC, Lindgaard)
  const baseTimes = {
    instant: TIME_SCALES.INSTANT,
    visualDecision: TIME_SCALES.VISUAL_DECISION,
    quick: TIME_SCALES.QUICK,
    normal: TIME_SCALES.NORMAL,
    extended: TIME_SCALES.EXTENDED
  };
  
  // Action-specific base times (research-aligned, calibrated)
  const actionTimes = {
    'page-load': baseTimes.normal,
    'reading': calculateReadingTime(contentLength),
    'interaction': baseTimes.quick,
    'evaluation': baseTimes.extended,
    'scanning': baseTimes.quick,
    'visual-appeal': baseTimes.visualDecision
  };
  
  // Calibration: visual-appeal needs minimum 100ms (research says 50ms, but our implementation has minimum)
  if (action === 'visual-appeal') {
    let time = TIME_BOUNDS.MIN_PERCEPTION; // Start at minimum
    if (attentionLevel === 'focused') time = 80;
    if (attentionLevel === 'distracted') time = 120;
    return Math.max(TIME_SCALES.VISUAL_DECISION, Math.min(200, time));
  }
  
  let time = actionTimes[action] || baseTimes.normal;
  
  // Adjust for attention level (research: attention affects temporal perception)
  time *= ATTENTION_MULTIPLIERS[attentionLevel] || 1.0;
  
  // Adjust for action complexity
  time *= COMPLEXITY_MULTIPLIERS[actionComplexity] || 1.0;
  
  // Adjust for persona (if provided)
  if (persona) {
    // Fast personas (e.g., power users) are faster
    // Slow personas (e.g., accessibility-focused) take more time
    if (persona.name?.toLowerCase().includes('power') || 
        persona.name?.toLowerCase().includes('expert')) {
      time *= 0.8;
    } else if (persona.name?.toLowerCase().includes('accessibility') ||
               persona.name?.toLowerCase().includes('careful')) {
      time *= 1.3; // Accessibility-focused users take more time
    }
  }
  
  // Ensure minimum time based on research (0.1s for perception)
  return Math.max(TIME_BOUNDS.MIN_PERCEPTION, Math.round(time));
}

/**
 * Calculate reading time based on content length
 * Based on research: average reading speed 200-300 words per minute
 * Calibrated based on experimental data (33.3% alignment → improved)
 */
function calculateReadingTime(contentLength) {
  // Average: 250 words per minute (research-based)
  // 1 word ≈ 5 characters
  const words = contentLength / 5;
  
  // Calibrated: Use faster speed for shorter content (scanning)
  // Slower speed for longer content (deep reading)
  const readingSpeed = words < CONTENT_THRESHOLDS.SHORT / 5 
    ? READING_SPEEDS.SCANNING 
    : words < CONTENT_THRESHOLDS.MEDIUM / 5 
    ? READING_SPEEDS.NORMAL 
    : READING_SPEEDS.DEEP;
  
  const minutes = words / readingSpeed;
  const milliseconds = minutes * 60 * 1000;
  
  // Calibrated bounds based on experimental data
  const minTime = contentLength < CONTENT_THRESHOLDS.SHORT 
    ? TIME_BOUNDS.MIN_READING_SHORT 
    : TIME_BOUNDS.MIN_READING_LONG;
  const maxTime = contentLength > CONTENT_THRESHOLDS.LONG 
    ? TIME_BOUNDS.MAX_READING_LONG 
    : TIME_BOUNDS.MAX_READING_SHORT;
  
  return Math.max(minTime, Math.min(maxTime, milliseconds));
}

/**
 * Calculate variance
 */
function calculateVariance(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
}

