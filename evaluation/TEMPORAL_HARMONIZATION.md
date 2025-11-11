# Temporal Decision-Making: Harmonized Implementation

## Overview

This document describes the harmonized temporal decision-making system, integrating research findings with experimental validation.

## Core Components

### 1. Sequential Decision Context (`src/temporal-decision.mjs`)

**Purpose:** Maintain context across LLM calls for better sequential decision-making

**Research Basis:**
- LLMs need explicit mechanisms for sequential decisions (arXiv:2406.12125)
- TUTRI player shows improvements with game history (arXiv:2508.10839)
- Reflection on action histories improves consistency

**Implementation:**
```javascript
const context = new SequentialDecisionContext({
  adaptationEnabled: true,
  maxHistory: 10
});

// Adapt prompt based on history
const adaptedPrompt = context.adaptPrompt(basePrompt, currentContext);

// Add decision to history
context.addDecision({ score, issues, assessment });
```

**Integration:**
- Used in `src/judge.mjs` for sequential context tracking
- Integrated into `TemporalBatchOptimizer` for batch processing
- Available in evaluation scripts for experimental analysis

### 2. Human Perception Time Modeling (`src/temporal-decision.mjs`)

**Purpose:** Model human perception at different time scales

**Research Basis:**
- 0.1s threshold for direct manipulation (NN/g)
- 50ms for visual appeal decisions (Lindgaard)
- 200-300 words/minute reading speed
- Attention affects temporal perception

**Implementation:**
```javascript
const time = humanPerceptionTime('reading', {
  contentLength: 1000,
  attentionLevel: 'normal', // 'focused', 'normal', 'distracted'
  actionComplexity: 'normal',
  persona: personaObject
});
```

**Integration:**
- Used in `src/persona-experience.mjs` for human time scales
- Replaces original `humanTimeScale()` with research-aligned version
- Accounts for attention, complexity, and persona characteristics

### 3. Multi-Scale Temporal Aggregation (`src/temporal-decision.mjs`)

**Purpose:** Aggregate temporal notes at multiple time scales

**Research Basis:**
- Human attention operates at multiple time scales (0.1s to 60s+)
- Different scales capture different aspects of perception

**Implementation:**
```javascript
const aggregated = aggregateMultiScale(temporalNotes, {
  timeScales: {
    immediate: 100,      // 0.1s - instant perception
    short: 1000,         // 1s - quick interaction
    medium: 10000,       // 10s - reading/scanning
    long: 60000          // 60s - deep evaluation
  },
  attentionWeights: true
});
```

**Features:**
- Attention-based weighting (recency, salience, action focus, novelty)
- Per-scale coherence analysis
- Captures different temporal patterns

### 4. Temporal Batch Optimizer (`src/temporal-batch-optimizer.mjs`)

**Purpose:** Adaptive batching with temporal dependencies

**Research Basis:**
- Online model selection achieves 6x gains with 1.5% LLM calls (arXiv:2406.12125)
- "Short and right" thinking management (arXiv:2505.13326)

**Implementation:**
```javascript
const optimizer = new TemporalBatchOptimizer({
  maxConcurrency: 3,
  batchSize: 2,
  sequentialContext: context,
  adaptiveBatching: true
});

// Add requests with temporal dependencies
await optimizer.addTemporalRequest(
  imagePath,
  prompt,
  context,
  dependencies // Array of dependent request IDs
);
```

**Features:**
- Handles temporal dependencies
- Priority-based processing
- Adaptive batch sizing
- Integrates with sequential context

## Harmonization Points

### 1. Time Scale Alignment

All components use consistent time scales:
- **Instant (100ms):** Direct manipulation threshold
- **Quick (1000ms):** Noticeable delay, quick interactions
- **Normal (3000ms):** Normal interactions, page loads
- **Extended (10000ms):** Deep evaluation, extended focus

### 2. Attention Modeling

Attention affects multiple components:
- **Human Perception Time:** Adjusts time based on attention level
- **Multi-Scale Aggregation:** Uses attention-based weighting
- **Sequential Context:** Considers attention in pattern identification

### 3. Sequential Flow

Components work together in sequential evaluations:
1. **Sequential Context** maintains history
2. **Temporal Batch Optimizer** processes with dependencies
3. **Multi-Scale Aggregation** analyzes temporal patterns
4. **Human Perception Time** models evaluation timing

### 4. Research Integration

All components are based on research findings:
- Sequential decision-making (arXiv papers)
- Human time perception (NN/g, PMC, Lindgaard)
- Batching strategies (arXiv papers)
- Attention and temporal perception (research)

## Usage Example

```javascript
import {
  SequentialDecisionContext,
  TemporalBatchOptimizer,
  aggregateMultiScale,
  humanPerceptionTime
} from 'ai-browser-test';

// 1. Create sequential context
const context = new SequentialDecisionContext();

// 2. Create temporal batch optimizer
const optimizer = new TemporalBatchOptimizer({
  sequentialContext: context
});

// 3. Process evaluations with temporal awareness
const results = await Promise.all(
  samples.map((sample, index) =>
    optimizer.addTemporalRequest(
      sample.screenshot,
      prompt,
      { testType: 'temporal' },
      index > 0 ? [samples[index - 1].id] : []
    )
  )
);

// 4. Aggregate temporal notes
const temporalNotes = results.map((r, i) => ({
  timestamp: Date.now() + i * 5000,
  score: r.score,
  observation: r.reasoning
}));

const aggregated = aggregateMultiScale(temporalNotes);

// 5. Analyze at different time scales
console.log('Immediate scale:', aggregated.scales.immediate);
console.log('Short scale:', aggregated.scales.short);
console.log('Medium scale:', aggregated.scales.medium);
console.log('Long scale:', aggregated.scales.long);
```

## Experimental Validation

The `evaluation/experimental-temporal-analysis.mjs` script tests:
1. Sequential decision consistency
2. Temporal perception alignment
3. Multi-scale aggregation effectiveness
4. Batching efficiency

## Future Enhancements

1. **Online Model Selection:** Implement research finding about 6x gains
2. **Reflection Mechanisms:** Add TUTRI-style reflection on action histories
3. **Adaptive Time Scales:** Adjust time scales based on content complexity
4. **Attention Tracking:** Track attention levels dynamically
5. **Momentum Effects:** Model recency and momentum effects from research

## References

- Efficient Sequential Decision Making (arXiv:2406.12125)
- Reinforced Language Models for Sequential Decision Making (arXiv:2508.10839)
- Serving LLM Reasoning Efficiently (arXiv:2505.13326)
- Powers of 10: Time Scales in UX (NN/g)
- Human Time Perception (PMC research)
- Visual Appeal Decisions (Lindgaard research)

