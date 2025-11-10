# Complete API Design: Making Testing Easy & Generalizable

## Goal
Expose interfaces/functionality that makes all queeraoke testing needs easy, while being generalizable to other projects.

## Current Package API (✅ Already Exists)

### Core Validation
- ✅ `validateScreenshot(path, prompt, context)` - Basic screenshot validation
- ✅ `VLLMJudge` - Low-level judge class
- ✅ `createConfig(options)` - Configuration

### Multi-Modal
- ✅ `extractRenderedCode(page)` - Extract HTML/CSS from Playwright page
- ✅ `captureTemporalScreenshots(page, fps, duration)` - Capture screenshots over time
- ✅ `multiPerspectiveEvaluation(validateFn, screenshotPath, renderedCode, gameState, personas)` - Multiple personas
- ✅ `multiModalValidation(validateFn, page, testName, options)` - Comprehensive validation

### Temporal
- ✅ `aggregateTemporalNotes(notes, options)` - Aggregate notes over time
- ✅ `formatNotesForPrompt(aggregated)` - Format for VLLM prompt
- ✅ `calculateCoherence(notes)` - Coherence analysis

### Cache
- ✅ `getCached`, `setCached`, `clearCache`, `getCacheStats`

## Missing Utilities (To Add)

### 1. ScoreTracker - Score Tracking & Baseline Comparison
**Why:** Used in multiple queeraoke tests for regression detection
**Generalizable:** Yes - any project needs score tracking

**API:**
```javascript
import { ScoreTracker } from '@visual-ai/validate';

const tracker = new ScoreTracker({ 
  baselineDir: 'test-results/baselines',
  autoSave: true 
});

// Record score
tracker.record('test-name', score, {
  provider: 'gemini',
  issues: ['issue1', 'issue2'],
  metadata: { viewport: { width: 1280, height: 720 } }
});

// Compare with baseline
const comparison = tracker.compare('test-name', score);
// Returns: { hasBaseline, baseline, current, delta, regression, improvement, trend }
```

**File:** `src/score-tracker.mjs`

### 2. BatchOptimizer - Batch Optimization
**Why:** Already exists in queeraoke, performance critical
**Generalizable:** Yes - any project with multiple VLLM calls needs batching

**API:**
```javascript
import { BatchOptimizer } from '@visual-ai/validate';

const optimizer = new BatchOptimizer({ 
  maxConcurrency: 5,
  cacheEnabled: true 
});

// Batch validate multiple screenshots
const results = await optimizer.batchValidate(
  screenshots.map(s => s.path),
  'Evaluate gameplay quality',
  { gameState: gameState }
);
```

**File:** `src/batch-optimizer.mjs`

### 3. FeedbackAggregator - Feedback Aggregation
**Why:** Used for iterative improvement in queeraoke
**Generalizable:** Yes - any project needs feedback aggregation

**API:**
```javascript
import { aggregateFeedback, generateRecommendations } from '@visual-ai/validate';

const aggregated = aggregateFeedback(judgeResults);
// Returns: { priority: { critical, high, medium, low }, stats: {...}, trends: {...} }

const recommendations = generateRecommendations(aggregated);
// Returns: Array of actionable recommendations
```

**File:** `src/feedback-aggregator.mjs`

### 4. ContextCompressor - Context Compression
**Why:** Used for long gameplay sessions in queeraoke
**Generalizable:** Yes - any project with long sessions needs compression

**API:**
```javascript
import { compressContext } from '@visual-ai/validate';

const compressed = compressContext(fullContext, {
  maxTokens: 2000,
  preserveRecent: true,
  preserveImportant: true
});
```

**File:** `src/context-compressor.mjs`

### 5. StructuredDataExtractor - Structured Data Extraction
**Why:** Used for game state extraction in queeraoke
**Generalizable:** Yes - any project needs structured data extraction

**API:**
```javascript
import { extractStructuredData } from '@visual-ai/validate';

const gameState = extractStructuredData(vllmResponse.judgment, {
  schema: {
    ballX: { type: 'number', required: true },
    ballY: { type: 'number', required: true },
    score: { type: 'number', required: false }
  },
  fallback: 'llm' // 'llm' | 'regex' | 'json'
});
```

**File:** `src/data-extractor.mjs`

### 6. High-Level Gameplay Helper (Optional)
**Why:** Makes gameplay testing easy in queeraoke
**Generalizable:** Yes - any project with interactive testing needs this

**API:**
```javascript
import { testGameplay } from '@visual-ai/validate';

const result = await testGameplay(page, {
  duration: 30000, // 30 seconds
  fps: 2, // 2 screenshots per second
  personas: [
    { name: 'Casual Gamer', perspective: '...' },
    { name: 'Accessibility Advocate', perspective: '...' }
  ],
  validateFn: validateScreenshot,
  captureState: true,
  captureCode: true
});

// Returns: { screenshots, evaluations, aggregated, notes }
```

**File:** `src/gameplay-helper.mjs`

## Implementation Plan

### Phase 1: Core Utilities (High Priority)
1. **ScoreTracker** - Used in multiple tests, general-purpose
2. **BatchOptimizer** - Performance critical, already exists in queeraoke
3. **StructuredDataExtractor** - Used for game state extraction

### Phase 2: Quality of Life (Medium Priority)
4. **FeedbackAggregator** - Used for iterative improvement
5. **ContextCompressor** - Used for long gameplay sessions
6. **GameplayHelper** - High-level gameplay testing (optional)

## Generalization Principles

1. **No Domain-Specific Logic**: Remove all queeraoke-specific references
2. **Configurable**: All behavior should be configurable via options
3. **Composable**: Functions should work together easily
4. **Extensible**: Easy to add custom personas, templates, etc.
5. **Well-Documented**: Clear examples for common patterns

## Example: Complete Testing Workflow

```javascript
import {
  validateScreenshot,
  testGameplay,
  ScoreTracker,
  BatchOptimizer,
  aggregateFeedback,
  generateRecommendations
} from '@visual-ai/validate';

// Setup
const tracker = new ScoreTracker({ baselineDir: 'test-results/baselines' });
const optimizer = new BatchOptimizer({ maxConcurrency: 5 });

// Test gameplay
const result = await testGameplay(page, {
  duration: 30000,
  fps: 2,
  validateFn: (path, prompt, context) => 
    optimizer.batchValidate([path], prompt, context)
});

// Track scores
result.evaluations.forEach(eval => {
  tracker.record(`gameplay-${eval.timestamp}`, eval.score, eval.metadata);
});

// Aggregate feedback
const aggregated = aggregateFeedback(result.evaluations);
const recommendations = generateRecommendations(aggregated);

// Compare with baseline
const comparison = tracker.compare('gameplay-final', result.aggregated.score);
if (comparison.regression) {
  console.warn(`Regression detected: ${comparison.baseline} -> ${comparison.current}`);
}
```

This makes gameplay testing easy and generalizable to any project.

## Next Steps

1. Implement Phase 1 utilities (ScoreTracker, BatchOptimizer, StructuredDataExtractor)
2. Update package exports in `src/index.mjs`
3. Update README with new APIs
4. Create examples for common patterns
5. Test with queeraoke to ensure compatibility

