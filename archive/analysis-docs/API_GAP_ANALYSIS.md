# API Gap Analysis: What Queeraoke Needs vs What Package Provides

## Current Package API

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
- ✅ `getCached(imagePath, prompt, context)`
- ✅ `setCached(imagePath, prompt, context, result)`
- ✅ `clearCache()`
- ✅ `getCacheStats()`

## What Queeraoke Tests Actually Use

### 1. `vllm-interactive-game.test.mjs`
**Uses:**
- `validateScreenshot` ✅
- `multiPerspectiveEvaluation` ✅
- `extractRenderedCode` ✅
- `aggregateTemporalNotes` ✅
- `formatNotesForPrompt` ✅
- `createConfig` ✅

**Custom Helpers (not in package):**
- `buildBrutalistCriteriaReference()` - Queeraoke-specific prompt template
- `buildProductPurposeReference()` - Queeraoke-specific prompt template
- `aggregateJudgeFeedback()` - Feedback aggregation (could be general)
- `generateImprovementRecommendations()` - Recommendations (could be general)
- `recordScore()` / `compareWithBaseline()` - Score tracking (could be general)

**Pattern:**
```javascript
// Multi-perspective evaluation with custom personas
const evaluations = await multiPerspectiveEvaluation(
  validateVLLM,
  screenshotPath,
  renderedCodeSnapshot,
  gameStateSnapshot
);

// Temporal aggregation
const aggregated = aggregateTemporalNotes(notes);
const prompt = formatNotesForPrompt(aggregated);
```

### 2. `vllm-reactive-gameplay.test.mjs`
**Uses:**
- `validateScreenshot` ✅
- `captureTemporalScreenshots` ✅ (implicitly via gameplay loop)

**Custom Helpers (not in package):**
- `extractGameStateFromText()` - LLM-based game state extraction (could be general)
- `compressContext()` - Context compression (could be general)
- `compressStateHistory()` - State history compression (could be general)

**Pattern:**
```javascript
// Continuous gameplay with reactive VLLM
while (playing) {
  const screenshot = await page.screenshot(...);
  const result = await validateScreenshot(screenshot, prompt, { gameState });
  // React based on result
}
```

### 3. `brick-breaker-experience-e2e.test.mjs`
**Uses:**
- `validateScreenshot` ✅

**Pattern:**
```javascript
// Simple validation at key moments
await validateScreenshot(screenshotPath, prompt, { gameState });
```

### 4. `brick-breaker-comprehensive.test.mjs`
**Uses:**
- `validateScreenshot` ✅

**Pattern:**
```javascript
// Property-based testing with VLLM validation
const result = await validateScreenshot(screenshotPath, prompt, { gameState });
```

## Gaps: What Should Be in Package

### 1. Score Tracking & Baseline Comparison
**Current:** Queeraoke has `recordScore()` and `compareWithBaseline()` in helpers
**Should be:** General-purpose score tracking in package

**API:**
```javascript
import { ScoreTracker } from '@visual-ai/validate';

const tracker = new ScoreTracker({ baselineDir: 'test-results/baselines' });
tracker.record('test-name', score, metadata);
const comparison = tracker.compare('test-name', score);
```

### 2. Feedback Aggregation
**Current:** Queeraoke has `aggregateJudgeFeedback()` in helpers
**Should be:** General-purpose feedback aggregation

**API:**
```javascript
import { aggregateFeedback } from '@visual-ai/validate';

const aggregated = aggregateFeedback(judgeResults);
const recommendations = generateRecommendations(aggregated);
```

### 3. Context Compression
**Current:** Queeraoke has `compressContext()` in helpers
**Should be:** General-purpose context compression for long gameplay sessions

**API:**
```javascript
import { compressContext } from '@visual-ai/validate';

const compressed = compressContext(fullContext, { maxTokens: 2000 });
```

### 4. Game State Extraction from VLLM
**Current:** Queeraoke has `extractGameStateFromText()` in helpers
**Should be:** General-purpose structured data extraction from VLLM responses

**API:**
```javascript
import { extractStructuredData } from '@visual-ai/validate';

const gameState = extractStructuredData(vllmResponse, {
  schema: { ballX: 'number', ballY: 'number', score: 'number' }
});
```

### 5. Prompt Templates
**Current:** Queeraoke has `buildBrutalistCriteriaReference()` in helpers
**Should be:** General-purpose prompt template builder (not queeraoke-specific)

**API:**
```javascript
import { buildPromptTemplate } from '@visual-ai/validate';

const prompt = buildPromptTemplate({
  criteria: ['contrast', 'accessibility', 'minimalism'],
  requirements: { contrast: '≥21:1' },
  zeroTolerance: ['contrast <21:1']
});
```

### 6. Batch Optimization
**Current:** Queeraoke has `vllm-batch-optimizer.mjs` in test directory
**Should be:** General-purpose batch optimization for parallel VLLM calls

**API:**
```javascript
import { BatchOptimizer } from '@visual-ai/validate';

const optimizer = new BatchOptimizer({ maxConcurrency: 5 });
const results = await optimizer.batchValidate(screenshots, prompt, context);
```

## Recommended Package Structure

### Core (Already Exists)
- `validateScreenshot` ✅
- `VLLMJudge` ✅
- `createConfig` ✅

### Multi-Modal (Already Exists)
- `extractRenderedCode` ✅
- `captureTemporalScreenshots` ✅
- `multiPerspectiveEvaluation` ✅
- `multiModalValidation` ✅

### Temporal (Already Exists)
- `aggregateTemporalNotes` ✅
- `formatNotesForPrompt` ✅
- `calculateCoherence` ✅

### New: Utilities
- `ScoreTracker` - Score tracking and baseline comparison
- `FeedbackAggregator` - Aggregate feedback from multiple evaluations
- `ContextCompressor` - Compress context for long sessions
- `StructuredDataExtractor` - Extract structured data from VLLM responses
- `PromptTemplateBuilder` - Build prompts from templates
- `BatchOptimizer` - Batch and optimize VLLM calls

### New: Helpers
- `extractGameState(page)` - Extract game state from page (general)
- `waitForGameState(page, predicate)` - Wait for game state condition
- `captureGameplaySession(page, options)` - High-level gameplay capture

## Implementation Priority

### High Priority (Core Functionality)
1. **ScoreTracker** - Used in multiple tests, general-purpose
2. **BatchOptimizer** - Performance critical, already exists in queeraoke
3. **StructuredDataExtractor** - Used for game state extraction

### Medium Priority (Quality of Life)
4. **FeedbackAggregator** - Used for iterative improvement
5. **ContextCompressor** - Used for long gameplay sessions
6. **PromptTemplateBuilder** - Makes prompts more maintainable

### Low Priority (Nice to Have)
7. **Game-specific helpers** - Could be separate package or examples

## Generalization Principles

1. **No Domain-Specific Logic**: Remove all queeraoke-specific references
2. **Configurable**: All behavior should be configurable
3. **Composable**: Functions should work together easily
4. **Extensible**: Easy to add custom personas, templates, etc.
5. **Well-Documented**: Clear examples for common patterns

## Example: Generalizable Gameplay Testing

```javascript
import {
  validateScreenshot,
  captureTemporalScreenshots,
  aggregateTemporalNotes,
  ScoreTracker,
  BatchOptimizer
} from '@visual-ai/validate';

// High-level gameplay testing (could be a helper)
async function testGameplay(page, options = {}) {
  const {
    duration = 30000,
    fps = 2,
    personas = [],
    validateFn = validateScreenshot
  } = options;
  
  // Capture temporal screenshots
  const screenshots = await captureTemporalScreenshots(page, fps, duration);
  
  // Validate with multiple perspectives
  const optimizer = new BatchOptimizer();
  const results = await optimizer.batchValidate(
    screenshots.map(s => s.path),
    'Evaluate gameplay quality',
    { gameState: await page.evaluate(() => window.gameState) }
  );
  
  // Aggregate results
  const notes = results.map((r, i) => ({
    timestamp: screenshots[i].timestamp,
    score: r.score,
    observation: r.assessment
  }));
  
  const aggregated = aggregateTemporalNotes(notes);
  
  return { results, aggregated };
}
```

This makes gameplay testing easy and generalizable to any project.

