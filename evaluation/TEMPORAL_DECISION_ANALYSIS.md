# Temporal Decision-Making & Human Perception Analysis

## Executive Summary

This document explores how decision-making happens over time with LLM calls, batching strategies, temporal sensing, and how this corresponds to human perception of reality in UI evaluation tasks.

## Key Research Areas

### 1. Sequential Decision-Making in LLMs

**Research Findings:**
- **Efficient Sequential Decision Making** (arXiv:2406.12125)
  - Online model selection for sequential decision-making
  - Avoids expensive re-evaluation
  - Adaptive strategies based on context

- **Reinforced Language Models for Sequential Decision Making** (arXiv:2508.10839)
  - Text-Mediated Stochastic Game (TMSG) framework
  - Learning-Augmented Policy (LAP) formalisms
  - Complete framework for analyzing LLM agents

- **Meta-Prompt Optimization** (arXiv:2502.00728)
  - Optimizes prompts for sequential decision-making
  - Adapts based on previous decisions
  - Improves efficiency over time

**Key Insights:**
- Sequential decisions should build on previous context
- Adaptive strategies outperform fixed approaches
- Temporal context matters for consistency

### 2. Human Perception of Time in UI Evaluation

**Research Findings:**
- **Powers of 10: Time Scales in UX** (NN/g)
  - 0.1 seconds: Perceived instant response
  - 1 second: User notices delay
  - 10 seconds: User loses focus
  - Different time scales for different interactions

- **Human Time Perception** (PMC research)
  - Minimum 0.1s for visual experience perception
  - 0.01-0.02s for auditory experience
  - Time perception is distorted by attention and actions

- **Attention and Time Perception**
  - Actions change time perception
  - Distracted states alter temporal judgment
  - Context affects perceived duration

**Key Insights:**
- Human perception operates at multiple time scales
- Attention affects temporal judgment
- Actions and context distort time perception

### 3. Batching Strategies

**Research Findings:**
- **Serving LLM Reasoning Efficiently** (arXiv:2505.13326)
  - SART framework: "short and right" thinking
  - Manages thinking duration
  - Balances accuracy and efficiency

**Key Insights:**
- Batching should consider temporal dependencies
- Not all decisions need equal processing time
- Adaptive batching improves efficiency

## Our Current Implementation Analysis

### Temporal Aggregation (`src/temporal.mjs`)

**Current Approach:**
```javascript
// Exponential decay weighting
weight = decayFactor^(age / windowSize)  // decayFactor = 0.9

// Temporal windows (10 second default)
windowIndex = Math.floor(elapsed / windowSize)

// Coherence calculation
coherence = 0.4 * directionConsistency + 
            0.3 * varianceCoherence + 
            0.3 * observationConsistency
```

**Strengths:**
- ✅ Exponential decay models recency bias
- ✅ Temporal windows capture time-based patterns
- ✅ Coherence checking identifies inconsistencies

**Gaps:**
- ⚠️ Fixed window size (doesn't adapt to content)
- ⚠️ No attention-based weighting
- ⚠️ Doesn't model human perception time scales
- ⚠️ No sequential decision context

### Human Time Scale (`src/persona-experience.mjs`)

**Current Approach:**
```javascript
// Reading time based on content length
words = contentLength / 5
readingSpeed = 250 words/minute
readingTime = (words / readingSpeed) * 60 * 1000

// Fixed interaction times
interactionTimes = {
  'click': 500ms,
  'type': 1000ms,
  'scroll': 800ms,
  'read': 2000ms,
  'think': 1500ms
}
```

**Strengths:**
- ✅ Models human reading speed
- ✅ Different times for different actions
- ✅ Content-length aware

**Gaps:**
- ⚠️ Doesn't account for attention/distraction
- ⚠️ Fixed speeds (doesn't vary by persona)
- ⚠️ Doesn't model time perception distortion
- ⚠️ No adaptation based on context

### Batch Optimization (`src/batch-optimizer.mjs`)

**Current Approach:**
```javascript
// Fixed batch size and concurrency
maxConcurrency = 5
batchSize = 3

// Process batches sequentially
await Promise.allSettled(promises)
```

**Strengths:**
- ✅ Respects concurrency limits
- ✅ Caching reduces redundant calls
- ✅ Queue management

**Gaps:**
- ⚠️ Fixed batch size (not adaptive)
- ⚠️ No temporal dependencies considered
- ⚠️ Doesn't prioritize by importance
- ⚠️ No sequential context between batches

## Research-Aligned Improvements

### 1. Adaptive Temporal Windows

**Research Finding:** Human attention operates at multiple time scales (0.1s to 10s+)

**Implementation:**
- Adaptive window sizes based on content complexity
- Multiple time scales for different evaluation aspects
- Attention-based weighting (not just recency)

### 2. Sequential Decision Context

**Research Finding:** Sequential decisions should build on previous context

**Implementation:**
- Maintain context across LLM calls
- Adaptive prompts based on previous evaluations
- Decision history influences current decisions

### 3. Human Perception Time Scales

**Research Finding:** Different time scales for different interactions (0.1s to 10s+)

**Implementation:**
- Model multiple perception time scales
- Account for attention and distraction
- Vary by persona and context

### 4. Adaptive Batching

**Research Finding:** Batching should consider temporal dependencies

**Implementation:**
- Dynamic batch sizes based on urgency
- Prioritize by temporal dependencies
- Consider sequential context

## Proposed Implementation

### 1. Multi-Scale Temporal Aggregation

```javascript
// Multiple time scales for different aspects
const timeScales = {
  immediate: 100,      // 0.1s - instant perception
  short: 1000,         // 1s - quick interactions
  medium: 10000,       // 10s - reading/scanning
  long: 60000          // 60s - deep evaluation
};

// Attention-based weighting
function calculateAttentionWeight(note, context) {
  // Higher weight for:
  // - Recent notes (recency)
  // - Important events (salience)
  // - User actions (attention focus)
  // - Context changes (novelty)
}
```

### 2. Sequential Decision Context

```javascript
// Maintain context across decisions
class SequentialDecisionContext {
  constructor() {
    this.history = [];
    this.currentState = null;
    this.adaptations = {};
  }
  
  // Adapt prompt based on history
  adaptPrompt(basePrompt, history) {
    // Include relevant history
    // Adjust based on previous decisions
    // Focus on inconsistencies
  }
}
```

### 3. Human Perception Time Modeling

```javascript
// Model human perception time scales
function humanPerceptionTime(action, context) {
  const baseTimes = {
    instant: 100,      // 0.1s - perceived instant
    quick: 1000,       // 1s - noticeable delay
    normal: 3000,      // 3s - normal interaction
    extended: 10000    // 10s - extended focus
  };
  
  // Adjust based on:
  // - Attention level
  // - Distraction state
  // - Action complexity
  // - Persona characteristics
}
```

### 4. Adaptive Batching with Temporal Dependencies

```javascript
// Batching with temporal awareness
class TemporalBatchOptimizer {
  // Prioritize by temporal dependencies
  prioritizeByDependencies(requests) {
    // Earlier screenshots first
    // Dependent evaluations after
    // Independent evaluations in parallel
  }
  
  // Adaptive batch size
  calculateBatchSize(context) {
    // Smaller batches for sequential dependencies
    // Larger batches for independent evaluations
    // Adjust based on urgency
  }
}
```

## Evaluation Plan

### 1. Temporal Decision Analysis

- Compare fixed vs adaptive temporal windows
- Measure coherence with different time scales
- Analyze decision consistency over time

### 2. Human Perception Alignment

- Compare mechanical vs human time scales
- Measure alignment with human judgment timing
- Analyze attention-based weighting

### 3. Sequential Decision Quality

- Compare isolated vs sequential decisions
- Measure context utilization
- Analyze adaptation effectiveness

### 4. Batching Efficiency

- Compare fixed vs adaptive batching
- Measure temporal dependency handling
- Analyze overall efficiency

## Next Steps

1. Implement adaptive temporal windows
2. Add sequential decision context
3. Enhance human perception modeling
4. Implement adaptive batching
5. Run evaluations comparing approaches
6. Analyze results and iterate

