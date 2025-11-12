# Temporal Decision-Making: Complete Guide

## Overview

This module implements research-aligned temporal decision-making for LLM evaluations, focusing on human perception, sequential context, and multi-scale analysis.

## Core Components

### 1. humanPerceptionTime ✅ **CLEARLY USEFUL**

Models human perception at different time scales based on research.

**Use Cases:**
- Persona-based testing (realistic timing)
- Simulating user behavior
- Content-aware interaction timing

**Example:**
```javascript
import { humanPerceptionTime } from 'ai-visual-test';

const time = humanPerceptionTime('reading', {
  contentLength: 1000,
  attentionLevel: 'normal',
  actionComplexity: 'normal',
  persona: { name: 'Power User' }
});
```

**Research Basis:**
- 0.1s threshold for direct manipulation (NN/g)
- 50ms for visual appeal decisions (Lindgaard)
- 200-300 words/minute reading speed

### 2. SequentialDecisionContext ⚠️ **PARTIALLY USEFUL**

Maintains context across LLM calls for better sequential decision-making.

**Use Cases:**
- Long-running evaluation sessions
- Consistency tracking across evaluations
- Pattern detection in evaluation history

**Example:**
```javascript
import { SequentialDecisionContext } from 'ai-visual-test';

const context = new SequentialDecisionContext({ maxHistory: 10 });
context.addDecision({ score: 8, issues: ['contrast'] });
const adaptedPrompt = context.adaptPrompt(basePrompt, {});
```

**Note:** Data shows it can increase variance if over-applied. Use adaptive confidence thresholds.

### 3. aggregateMultiScale ❓ **QUESTIONABLE UTILITY**

Aggregates temporal notes at multiple time scales.

**Potential Use Cases:**
- Analyzing UI changes over different time scales
- Understanding immediate vs. long-term patterns
- Detecting trends at different granularities

**Example:**
```javascript
import { aggregateMultiScale } from 'ai-visual-test';

const aggregated = aggregateMultiScale(notes, {
  timeScales: {
    immediate: 100,   // 0.1s
    short: 1000,      // 1s
    medium: 10000,    // 10s
    long: 60000       // 60s
  }
});
```

**Note:** No clear use case demonstrated. Consider if you actually need multi-scale analysis.

### 4. TemporalBatchOptimizer ❓ **QUESTIONABLE UTILITY**

Temporal-aware batching with dependencies.

**Potential Use Cases:**
- Processing screenshots in sequence with dependencies
- Optimizing batch processing based on temporal order
- Handling dependencies between evaluations

**Example:**
```javascript
import { TemporalBatchOptimizer } from 'ai-visual-test';

const optimizer = new TemporalBatchOptimizer({
  sequentialContext: context,
  maxConcurrency: 2
});
```

**Note:** No real dependency scenarios shown. Regular BatchOptimizer might be sufficient.

## Constants

All magic numbers are centralized in `temporal-constants.mjs`:

```javascript
import {
  TIME_SCALES,
  MULTI_SCALE_WINDOWS,
  READING_SPEEDS,
  ATTENTION_MULTIPLIERS,
  COMPLEXITY_MULTIPLIERS,
  CONFIDENCE_THRESHOLDS,
  TIME_BOUNDS
} from 'ai-visual-test';
```

## Error Handling

Custom error types for better debugging:

```javascript
import {
  TemporalError,
  PerceptionTimeError,
  SequentialContextError,
  MultiScaleError
} from 'ai-visual-test';
```

## Validation

Input validation is built-in:

```javascript
import { validateNotes, validateAction, validatePerceptionContext } from 'ai-visual-test/temporal-validation';
```

## Context Utilities

Standardized context creation:

```javascript
import { createTemporalContext, mergeTemporalContext } from 'ai-visual-test';

const context = createTemporalContext({
  attentionLevel: 'focused',
  actionComplexity: 'normal',
  persona: myPersona
});
```

## Research Foundation

Based on:
- Efficient Sequential Decision Making (arXiv:2406.12125)
- Human Time Perception (PMC research)
- Powers of 10: Time Scales in UX (NN/g)

## Recommendations

**Use:**
- ✅ `humanPerceptionTime` - Clearly useful
- ⚠️ `SequentialDecisionContext` - Use with caution, enable adaptive confidence

**Question:**
- ❓ `aggregateMultiScale` - Only if you have a clear multi-scale use case
- ❓ `TemporalBatchOptimizer` - Only if you have real temporal dependencies

**Focus on:**
- What you actually need
- Simple, clear use cases
- Proven utility

