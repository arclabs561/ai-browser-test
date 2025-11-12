# Queeraoke Current Usage of ai-visual-test

## Overview

This document captures how queeraoke **actually uses** the `ai-visual-test` library based on code analysis.

## Import Patterns

### Primary Imports

```javascript
// Most common pattern (38+ test files)
import { validateScreenshot, createConfig } from 'ai-visual-test';

// Configuration
const config = createConfig();
```

### Temporal/Interactive Tests

```javascript
// Used in interactive/reactive gameplay tests
import { 
  aggregateTemporalNotes, 
  formatNotesForPrompt,
  captureTemporalScreenshots 
} from 'ai-visual-test';
```

### Multi-Modal Tests

```javascript
// Used in multi-modal validation tests
import { 
  extractRenderedCode, 
  multiModalValidation 
} from 'ai-visual-test';
```

### Batch Optimization

```javascript
// Used in some tests for batching
import { BatchOptimizer } from 'ai-visual-test';
```

## Usage Patterns

### Pattern 1: Static Screenshot Validation

**Files**: `visual-regression-vllm.test.mjs`, `qr-avatar-ux.test.mjs`, `accessibility-visual-vllm.test.mjs`

```javascript
import { validateScreenshot, createConfig } from 'ai-visual-test';

const config = createConfig();
const result = await validateScreenshot(screenshotPath, prompt, {
  testType: 'visual-regression',
  viewport: { width: 1280, height: 720 }
});

// Check result
assert.ok(result.score !== null);
assert.ok(result.score >= 0 && result.score <= 10);
```

**Characteristics**:
- Single screenshot validation
- Basic context (testType, viewport)
- No temporal notes
- No research enhancements

### Pattern 2: Interactive Gameplay Testing

**Files**: `interactive-gameplay.test.mjs`, `reactive-gameplay.test.mjs`

```javascript
import { 
  validateScreenshot,
  aggregateTemporalNotes,
  formatNotesForPrompt,
  captureTemporalScreenshots 
} from 'ai-visual-test';

// Capture temporal screenshots
const temporalScreenshots = await captureTemporalScreenshots(page, {
  fps: 2,
  duration: 5000
});

// Aggregate temporal notes
const notes = temporalScreenshots.map(s => ({
  timestamp: s.timestamp,
  elapsed: s.elapsed,
  observation: s.observation,
  score: s.score
}));

const aggregated = aggregateTemporalNotes(notes);

// Validate with temporal context
const result = await validateScreenshot(screenshotPath, prompt, {
  testType: 'gameplay',
  temporalNotes: aggregated
});
```

**Characteristics**:
- Multiple screenshots over time
- Temporal aggregation
- Notes formatted for prompts
- Temporal context passed to validation

### Pattern 3: Multi-Modal Validation

**Files**: `multi-modal.test.mjs`, `accessibility-multi-modal.test.mjs`

```javascript
import { 
  extractRenderedCode, 
  multiModalValidation 
} from 'ai-visual-test';

// Extract rendered code
const renderedCode = await extractRenderedCode(page);

// Multi-modal validation
const result = await multiModalValidation(
  validateScreenshot,
  page,
  'test-name',
  {
    captureCode: true,
    captureState: true
  }
);
```

**Characteristics**:
- Screenshot + HTML + CSS + DOM
- Multi-modal fusion
- Rendered code extraction

### Pattern 4: Batch Optimization

**Files**: Some performance tests

```javascript
import { BatchOptimizer } from 'ai-visual-test';

const optimizer = new BatchOptimizer({
  maxConcurrency: 3,
  batchSize: 5
});

// Add requests
const requests = screenshots.map(screenshot => 
  optimizer.addRequest(screenshot, prompt, context)
);

// Process batch
const results = await Promise.all(requests);
```

**Characteristics**:
- Multiple validations batched
- Concurrency control
- Batch size optimization

## What Queeraoke Does NOT Use

### Research-Enhanced Functions

❌ **`validateWithResearchEnhancements`** - Not used
❌ **`validateMultipleWithPositionAnalysis`** - Not used  
❌ **`validateWithExplicitRubric`** - Not used
❌ **`validateWithLengthAlignment`** - Not used
❌ **`validateWithAllResearchEnhancements`** - Not used

### Temporal Decision Features

❌ **`TemporalDecisionManager`** - Not used (newly implemented)
❌ **`pruneTemporalNotes`** - Not used (newly implemented)
❌ **`selectTopWeightedNotes`** - Not used (newly implemented)
❌ **`TemporalBatchOptimizer`** - Not used (uses `BatchOptimizer` instead)

### Advanced Features

❌ **`EnsembleJudge`** - Not used
❌ **`HumanValidationManager`** - Not used
❌ **`ExplanationManager`** - Not used
❌ **`ExperienceTrace`** - Not used

## Integration Opportunities

### 1. Research Enhancements

**Current**: Basic `validateScreenshot` calls
**Opportunity**: Use `validateWithExplicitRubric` for 10-20% reliability improvement

```javascript
// Before
const result = await validateScreenshot(screenshotPath, prompt, {
  testType: 'visual-regression'
});

// After
import { validateWithExplicitRubric } from 'ai-visual-test';

const result = await validateWithExplicitRubric(screenshotPath, prompt, {
  testType: 'visual-regression',
  useDefaultRubric: true
});
```

### 2. Temporal Decision Logic

**Current**: Manual temporal note aggregation
**Opportunity**: Use `TemporalDecisionManager` for when-to-prompt decisions

```javascript
// Before
const aggregated = aggregateTemporalNotes(notes);
const result = await validateScreenshot(screenshotPath, prompt, {
  temporalNotes: aggregated
});

// After
import { TemporalDecisionManager } from 'ai-visual-test';

const decisionManager = new TemporalDecisionManager();
const decision = decisionManager.shouldPrompt(currentState, previousState, notes);

if (decision.shouldPrompt) {
  const result = await validateScreenshot(screenshotPath, prompt, {
    temporalNotes: notes
  });
}
```

### 3. Note Pruning

**Current**: Pass all temporal notes
**Opportunity**: Prune to top-weighted notes

```javascript
// Before
const result = await validateScreenshot(screenshotPath, prompt, {
  temporalNotes: allNotes // Could be 100+ notes
});

// After
import { selectTopWeightedNotes } from 'ai-visual-test';

const topNotes = await selectTopWeightedNotes(allNotes, { topN: 10 });
const result = await validateScreenshot(screenshotPath, prompt, {
  temporalNotes: topNotes
});
```

## Summary

**What Queeraoke Uses**:
- ✅ `validateScreenshot` (extensively)
- ✅ `createConfig`
- ✅ `aggregateTemporalNotes` (interactive tests)
- ✅ `formatNotesForPrompt` (interactive tests)
- ✅ `extractRenderedCode` (multi-modal tests)
- ✅ `multiModalValidation` (multi-modal tests)
- ✅ `captureTemporalScreenshots` (reactive tests)
- ✅ `BatchOptimizer` (some tests)

**What Queeraoke Doesn't Use**:
- ❌ Research-enhanced validation functions
- ❌ Temporal decision manager
- ❌ Note pruning
- ❌ Ensemble judging
- ❌ Human validation
- ❌ Explanation manager

**Integration Potential**:
- High: Research enhancements (explicit rubrics, bias mitigation)
- Medium: Temporal decision logic (when to prompt)
- Medium: Note pruning (reduce prompt size)
- Low: Ensemble judging (cost vs. benefit)
- Low: Human validation (requires infrastructure)

