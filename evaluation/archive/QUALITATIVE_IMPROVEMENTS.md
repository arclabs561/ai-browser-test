# Qualitative Improvements: Concrete Actions

Based on the qualitative review, here are specific improvements to implement:

## 1. Centralize Constants

**Problem:** Magic numbers and time scales defined in multiple places

**Solution:** Create `src/temporal-constants.mjs`

```javascript
/**
 * Temporal Constants
 * Centralized definitions for all temporal decision-making constants
 */

// Time Scales (based on research: NN/g, PMC, Lindgaard)
export const TIME_SCALES = {
  INSTANT: 100,           // 0.1s - perceived instant, direct manipulation threshold (NN/g)
  VISUAL_DECISION: 50,    // 50ms - visual appeal decision (Lindgaard research)
  QUICK: 1000,            // 1s - noticeable delay (NN/g)
  NORMAL: 3000,          // 3s - normal interaction
  EXTENDED: 10000,        // 10s - extended focus (NN/g)
  LONG: 60000             // 60s - deep evaluation
};

// Multi-Scale Windows
export const MULTI_SCALE_WINDOWS = {
  immediate: TIME_SCALES.INSTANT,
  short: TIME_SCALES.QUICK,
  medium: TIME_SCALES.EXTENDED,
  long: TIME_SCALES.LONG
};

// Reading Speeds (words per minute)
export const READING_SPEEDS = {
  SCANNING: 300,    // Fast scanning
  NORMAL: 250,      // Average reading
  DEEP: 200         // Deep reading
};

// Attention Multipliers
export const ATTENTION_MULTIPLIERS = {
  focused: 0.8,      // Faster when focused (reduced cognitive load)
  normal: 1.0,
  distracted: 1.5    // Slower when distracted (increased cognitive load)
};

// Complexity Multipliers
export const COMPLEXITY_MULTIPLIERS = {
  simple: 0.7,       // Simple actions are faster
  normal: 1.0,
  complex: 1.5       // Complex actions take longer
};

// Confidence Thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH_VARIANCE: 1.0,    // Variance < 1.0 = high confidence
  MEDIUM_VARIANCE: 2.0,  // Variance < 2.0 = medium confidence
  LOW_VARIANCE: 2.0      // Variance >= 2.0 = low confidence
};

// Time Bounds
export const TIME_BOUNDS = {
  MIN_PERCEPTION: 100,      // Minimum perception time (0.1s)
  MIN_READING_SHORT: 1000,  // Minimum reading time for short content
  MIN_READING_LONG: 2000,   // Minimum reading time for long content
  MAX_READING_SHORT: 15000,  // Maximum reading time for short content
  MAX_READING_LONG: 30000    // Maximum reading time for long content
};
```

## 2. Standardize Error Handling

**Problem:** Inconsistent error handling patterns

**Solution:** Create custom error types

```javascript
// src/temporal-errors.mjs
export class TemporalError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'TemporalError';
    this.code = code;
    this.context = context;
  }
}

export class PerceptionTimeError extends TemporalError {
  constructor(message, context = {}) {
    super(message, 'PERCEPTION_TIME_ERROR', context);
    this.name = 'PerceptionTimeError';
  }
}

export class SequentialContextError extends TemporalError {
  constructor(message, context = {}) {
    super(message, 'SEQUENTIAL_CONTEXT_ERROR', context);
    this.name = 'SequentialContextError';
  }
}
```

## 3. Consolidate Documentation

**Current:** 10+ documentation files
**Target:** 4 core documents

1. **TEMPORAL_SYSTEM.md** - Complete system overview
2. **RESEARCH_FOUNDATION.md** - Research citations and alignment
3. **API_REFERENCE.md** - API documentation
4. **EVALUATION_GUIDE.md** - How to evaluate and improve

## 4. Simplify Complex Functions

**Problem:** Some functions are too long and complex

**Example:** `aggregateMultiScale` could be broken down:

```javascript
// Before: One large function
export function aggregateMultiScale(notes, options = {}) {
  // 100+ lines of logic
}

// After: Composed from smaller functions
export function aggregateMultiScale(notes, options = {}) {
  const validNotes = validateAndSortNotes(notes);
  if (validNotes.length === 0) return emptyResult();
  
  const scales = {};
  for (const [scaleName, windowSize] of Object.entries(getTimeScales(options))) {
    scales[scaleName] = aggregateAtScale(validNotes, windowSize, options);
  }
  
  return {
    scales,
    summary: generateSummary(scales),
    coherence: calculateCoherence(scales)
  };
}

function aggregateAtScale(notes, windowSize, options) {
  const windows = createWindows(notes, windowSize);
  const weightedWindows = applyAttentionWeights(windows, options);
  return {
    windowSize,
    windows: weightedWindows,
    coherence: calculateCoherenceForScale(weightedWindows)
  };
}
```

## 5. Add Input Validation

**Problem:** Minimal input validation

**Solution:** Add validation functions

```javascript
// src/temporal-validation.mjs
export function validateNotes(notes) {
  if (!Array.isArray(notes)) {
    throw new TemporalError('Notes must be an array', 'INVALID_NOTES');
  }
  
  return notes.filter(note => {
    if (!note.timestamp && note.elapsed === undefined) {
      console.warn('Note missing timestamp or elapsed:', note);
      return false;
    }
    return true;
  });
}

export function validateTimeScales(timeScales) {
  if (typeof timeScales !== 'object') {
    throw new TemporalError('Time scales must be an object', 'INVALID_TIME_SCALES');
  }
  
  for (const [name, value] of Object.entries(timeScales)) {
    if (typeof value !== 'number' || value <= 0) {
      throw new TemporalError(`Invalid time scale ${name}: ${value}`, 'INVALID_TIME_SCALE');
    }
  }
  
  return true;
}
```

## 6. Standardize Context Passing

**Problem:** Context structure varies

**Solution:** Define standard context interface

```javascript
// src/temporal-context.mjs
export function createTemporalContext(options = {}) {
  return {
    sequentialContext: options.sequentialContext || null,
    viewport: options.viewport || null,
    testType: options.testType || null,
    enableBiasMitigation: options.enableBiasMitigation !== false,
    attentionLevel: options.attentionLevel || 'normal',
    actionComplexity: options.actionComplexity || 'normal',
    persona: options.persona || null,
    ...options
  };
}

export function mergeTemporalContext(base, additional) {
  return {
    ...base,
    ...additional,
    sequentialContext: additional.sequentialContext || base.sequentialContext
  };
}
```

## 7. Add Logging Infrastructure

**Problem:** No structured logging

**Solution:** Add logging utility

```javascript
// src/temporal-logger.mjs
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

let logLevel = LOG_LEVELS.INFO;

export function setLogLevel(level) {
  logLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
}

export function log(level, message, context = {}) {
  if (LOG_LEVELS[level] >= logLevel) {
    console[level.toLowerCase()](`[Temporal] ${message}`, context);
  }
}

export const logger = {
  debug: (msg, ctx) => log('DEBUG', msg, ctx),
  info: (msg, ctx) => log('INFO', msg, ctx),
  warn: (msg, ctx) => log('WARN', msg, ctx),
  error: (msg, ctx) => log('ERROR', msg, ctx)
};
```

## 8. Priority Order

### Immediate (High Value, Low Effort)
1. ✅ Centralize constants
2. ✅ Add input validation
3. ✅ Standardize context passing

### Short-term (High Value, Medium Effort)
4. ✅ Simplify complex functions
5. ✅ Standardize error handling
6. ✅ Consolidate documentation

### Long-term (Medium Value, High Effort)
7. ⏳ Add logging infrastructure
8. ⏳ Add metrics/telemetry
9. ⏳ Configuration support

## 9. Implementation Strategy

1. **Start with constants** - Single source of truth
2. **Add validation** - Prevent errors early
3. **Refactor incrementally** - Don't break existing code
4. **Test as you go** - Maintain test coverage
5. **Document changes** - Update docs with improvements

## 10. Success Criteria

- [ ] All magic numbers replaced with constants
- [ ] All inputs validated
- [ ] Consistent error handling
- [ ] Documentation consolidated
- [ ] Complex functions simplified
- [ ] Context passing standardized
- [ ] Logging infrastructure added
- [ ] All tests still passing
- [ ] Performance maintained or improved

