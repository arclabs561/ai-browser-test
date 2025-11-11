/**
 * Experience Tracer
 * 
 * Tracks and traces user experiences over time, integrating:
 * - Persona-based experience notes
 * - VLLM validation results
 * - Temporal aggregation
 * - State changes and interactions
 * 
 * Provides full traceability for debugging and meta-evaluation.
 */

/**
 * Experience Trace
 * 
 * Complete trace of a user experience journey with all events, validations, and state changes.
 */
export class ExperienceTrace {
  constructor(sessionId, persona = null) {
    this.sessionId = sessionId;
    this.persona = persona;
    this.startTime = Date.now();
    this.events = [];
    this.validations = [];
    this.screenshots = [];
    this.stateHistory = [];
    this.aggregatedNotes = null;
    this.metaEvaluation = null;
  }

  /**
   * Add an experience event
   * 
   * @param {string} type - Event type ('interaction', 'state-change', 'validation', 'screenshot')
   * @param {Object} data - Event data
   * @param {number} timestamp - Event timestamp (defaults to now)
   */
  addEvent(type, data, timestamp = null) {
    const event = {
      id: `${this.sessionId}-${this.events.length}`,
      type,
      timestamp: timestamp || Date.now(),
      elapsed: (timestamp || Date.now()) - this.startTime,
      data
    };
    
    this.events.push(event);
    return event;
  }

  /**
   * Add VLLM validation result
   * 
   * @param {Object} validation - Validation result from validateScreenshot
   * @param {string} context - Validation context (stage, interaction, etc.)
   */
  addValidation(validation, context = {}) {
    const validationEvent = {
      id: `${this.sessionId}-validation-${this.validations.length}`,
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      validation,
      context,
      screenshot: validation.screenshotPath || null
    };
    
    this.validations.push(validationEvent);
    this.addEvent('validation', { validationId: validationEvent.id, context });
    
    return validationEvent;
  }

  /**
   * Add screenshot capture
   * 
   * @param {string} path - Screenshot path
   * @param {string} step - Step name
   * @param {Object} metadata - Additional metadata
   */
  addScreenshot(path, step, metadata = {}) {
    const screenshot = {
      id: `${this.sessionId}-screenshot-${this.screenshots.length}`,
      path,
      step,
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      ...metadata
    };
    
    this.screenshots.push(screenshot);
    this.addEvent('screenshot', { screenshotId: screenshot.id, step });
    
    return screenshot;
  }

  /**
   * Add state snapshot
   * 
   * @param {Object} state - State object (pageState, gameState, etc.)
   * @param {string} label - State label
   */
  addStateSnapshot(state, label = '') {
    const snapshot = {
      id: `${this.sessionId}-state-${this.stateHistory.length}`,
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      state,
      label
    };
    
    this.stateHistory.push(snapshot);
    this.addEvent('state-change', { stateId: snapshot.id, label });
    
    return snapshot;
  }

  /**
   * Aggregate experience notes temporally
   * 
   * @param {Function} aggregateTemporalNotes - Temporal aggregation function
   * @param {Object} options - Aggregation options
   */
  aggregateNotes(aggregateTemporalNotes, options = {}) {
    // Extract notes from events and validations
    const eventNotes = this.events
      .filter(e => e.type === 'interaction' || e.type === 'observation')
      .map(e => ({
        step: e.data.step || e.type,
        timestamp: e.timestamp,
        elapsed: e.elapsed,
        observation: e.data.observation || e.data.reasoning || '',
        score: e.data.score || null,
        gameState: e.data.gameState || null
      }));
    
    const validationNotes = this.validations.map(v => ({
      step: `validation_${v.context.stage || 'unknown'}`,
      timestamp: v.timestamp,
      elapsed: v.elapsed,
      observation: v.validation.reasoning || v.validation.issues?.join(' ') || '',
      score: v.validation.score || null,
      gameState: v.context.gameState || null
    }));
    
    const notes = [...eventNotes, ...validationNotes].sort((a, b) => a.timestamp - b.timestamp);

    this.aggregatedNotes = aggregateTemporalNotes(notes, options);
    return this.aggregatedNotes;
  }

  /**
   * Get trace summary
   * 
   * @returns {Object} Trace summary
   */
  getSummary() {
    return {
      sessionId: this.sessionId,
      persona: this.persona,
      duration: Date.now() - this.startTime,
      eventCount: this.events.length,
      validationCount: this.validations.length,
      screenshotCount: this.screenshots.length,
      stateSnapshotCount: this.stateHistory.length,
      hasAggregatedNotes: !!this.aggregatedNotes,
      hasMetaEvaluation: !!this.metaEvaluation
    };
  }

  /**
   * Get full trace for debugging
   * 
   * @returns {Object} Complete trace
   */
  getFullTrace() {
    return {
      sessionId: this.sessionId,
      persona: this.persona,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      events: this.events,
      validations: this.validations,
      screenshots: this.screenshots,
      stateHistory: this.stateHistory,
      aggregatedNotes: this.aggregatedNotes,
      metaEvaluation: this.metaEvaluation,
      summary: this.getSummary()
    };
  }

  /**
   * Export trace to JSON
   * 
   * @param {string} filePath - Path to save trace
   */
  async exportToJSON(filePath) {
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, JSON.stringify(this.getFullTrace(), null, 2));
  }
}

/**
 * Experience Tracer Manager
 * 
 * Manages multiple experience traces and provides meta-evaluation capabilities.
 */
export class ExperienceTracerManager {
  constructor() {
    this.traces = new Map();
    this.metaEvaluations = [];
  }

  /**
   * Create a new trace
   * 
   * @param {string} sessionId - Unique session ID
   * @param {Object} persona - Persona configuration
   * @returns {ExperienceTrace} New trace
   */
  createTrace(sessionId, persona = null) {
    const trace = new ExperienceTrace(sessionId, persona);
    this.traces.set(sessionId, trace);
    return trace;
  }

  /**
   * Get trace by session ID
   * 
   * @param {string} sessionId - Session ID
   * @returns {ExperienceTrace|null} Trace or null
   */
  getTrace(sessionId) {
    return this.traces.get(sessionId) || null;
  }

  /**
   * Get all traces
   * 
   * @returns {Array} Array of traces
   */
  getAllTraces() {
    return Array.from(this.traces.values());
  }

  /**
   * Meta-evaluate trace quality
   * 
   * Evaluates the quality of the trace itself:
   * - Completeness (are all events captured?)
   * - Consistency (do validations align with events?)
   * - Coverage (are all stages covered?)
   * - Temporal coherence (do notes make sense over time?)
   * 
   * @param {string} sessionId - Session ID
   * @param {Function} validateScreenshot - VLLM validation function
   * @returns {Promise<Object>} Meta-evaluation result
   */
  async metaEvaluateTrace(sessionId, validateScreenshot) {
    const trace = this.getTrace(sessionId);
    if (!trace) {
      throw new Error(`Trace not found: ${sessionId}`);
    }

    const evaluation = {
      sessionId,
      timestamp: Date.now(),
      completeness: this.evaluateCompleteness(trace),
      consistency: this.evaluateConsistency(trace),
      coverage: this.evaluateCoverage(trace),
      temporalCoherence: this.evaluateTemporalCoherence(trace),
      quality: null
    };

    // Calculate overall quality score
    evaluation.quality = (
      evaluation.completeness.score +
      evaluation.consistency.score +
      evaluation.coverage.score +
      evaluation.temporalCoherence.score
    ) / 4;

    // If we have screenshots, validate the trace visually
    if (trace.screenshots.length > 0) {
      const lastScreenshot = trace.screenshots[trace.screenshots.length - 1];
      try {
        const visualValidation = await validateScreenshot(
          lastScreenshot.path,
          `Meta-evaluate this experience trace. Check if:
          - All stages are captured (initial, form, payment, gameplay)
          - Screenshots show progression
          - State changes are visible
          - The experience is complete and traceable`,
          {
            testType: 'meta-evaluation',
            trace: trace.getSummary()
          }
        );
        evaluation.visualValidation = visualValidation;
      } catch (e) {
        console.warn('Visual meta-evaluation failed:', e.message);
      }
    }

    trace.metaEvaluation = evaluation;
    this.metaEvaluations.push(evaluation);

    return evaluation;
  }

  /**
   * Evaluate trace completeness
   */
  evaluateCompleteness(trace) {
    const requiredEvents = ['screenshot', 'validation', 'state-change'];
    const eventTypes = new Set(trace.events.map(e => e.type));
    
    const missing = requiredEvents.filter(type => !eventTypes.has(type));
    const completeness = 1 - (missing.length / requiredEvents.length);
    
    return {
      score: completeness * 10,
      missing,
      eventTypes: Array.from(eventTypes),
      totalEvents: trace.events.length
    };
  }

  /**
   * Evaluate trace consistency
   */
  evaluateConsistency(trace) {
    // Check if validations align with events
    const validationEvents = trace.events.filter(e => e.type === 'validation');
    const validations = trace.validations;
    
    const alignment = validations.length > 0 && validationEvents.length > 0
      ? Math.min(validations.length / validationEvents.length, 1)
      : 0;
    
    // Check if state changes are consistent
    const stateChanges = trace.events.filter(e => e.type === 'state-change');
    const stateSnapshots = trace.stateHistory;
    
    const stateConsistency = stateChanges.length > 0 && stateSnapshots.length > 0
      ? Math.min(stateSnapshots.length / stateChanges.length, 1)
      : 0;
    
    const consistency = (alignment + stateConsistency) / 2;
    
    return {
      score: consistency * 10,
      validationAlignment: alignment,
      stateConsistency: stateConsistency,
      validationCount: validations.length,
      stateSnapshotCount: stateSnapshots.length
    };
  }

  /**
   * Evaluate trace coverage
   */
  evaluateCoverage(trace) {
    const expectedStages = ['initial', 'form', 'payment', 'gameplay'];
    const stageLabels = trace.events
      .map(e => e.data.stage || e.data.step || '')
      .filter(s => s);
    
    const coveredStages = expectedStages.filter(stage =>
      stageLabels.some(label => label.toLowerCase().includes(stage))
    );
    
    const coverage = coveredStages.length / expectedStages.length;
    
    return {
      score: coverage * 10,
      expectedStages,
      coveredStages,
      coverage: coverage
    };
  }

  /**
   * Evaluate temporal coherence
   */
  evaluateTemporalCoherence(trace) {
    if (!trace.aggregatedNotes) {
      return {
        score: 0,
        reason: 'No aggregated notes available'
      };
    }

    const coherence = trace.aggregatedNotes.coherence || 0;
    const conflicts = trace.aggregatedNotes.conflicts || [];
    
    return {
      score: coherence * 10,
      coherence: coherence,
      conflicts: conflicts.length,
      windows: trace.aggregatedNotes.windows?.length || 0
    };
  }

  /**
   * Get meta-evaluation summary
   * 
   * @returns {Object} Summary of all meta-evaluations
   */
  getMetaEvaluationSummary() {
    if (this.metaEvaluations.length === 0) {
      return {
        totalEvaluations: 0,
        averageQuality: null
      };
    }

    const qualities = this.metaEvaluations
      .map(e => e.quality)
      .filter(q => q !== null);
    
    return {
      totalEvaluations: this.metaEvaluations.length,
      averageQuality: qualities.length > 0
        ? qualities.reduce((a, b) => a + b, 0) / qualities.length
        : null,
      evaluations: this.metaEvaluations
    };
  }
}

// Singleton instance
let tracerManager = null;

/**
 * Get or create tracer manager
 * 
 * @returns {ExperienceTracerManager} Tracer manager instance
 */
export function getTracerManager() {
  if (!tracerManager) {
    tracerManager = new ExperienceTracerManager();
  }
  return tracerManager;
}

