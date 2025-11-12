# Late Interaction Gaps: Temporal Sequences and Experience Data

## Overview

Late interaction in `ai-visual-test` currently has significant gaps when dealing with temporal sequences, experience data, and multi-step reasoning. This document identifies these gaps and outlines what needs to be addressed.

## Current State

### What We Have

1. **Basic Late Interaction** (`src/explanation-manager.mjs`):
   - Can explain single judgments
   - Supports question-answering about judgments
   - Caches explanations
   - **Limitation**: Only works with static screenshots, no temporal context

2. **Temporal Aggregation** (`src/temporal.mjs`, `src/temporal-decision.mjs`):
   - Aggregates notes over time windows
   - Multi-scale temporal analysis
   - Coherence checking
   - **Limitation**: Not integrated with late interaction explanations

3. **Experience Tracing** (`src/experience-tracer.mjs`):
   - Tracks state snapshots, events, validations
   - Stores experience traces with session IDs
   - **Limitation**: Experience data not used in explanations

4. **Human Validation** (`src/human-validation-manager.mjs`):
   - Stores `experienceTrace` in judgment context
   - **Limitation**: Experience trace not passed to explanation manager

### What's Missing

## Gap 1: Temporal Context in Explanations

**Problem**: When explaining a judgment, the explanation manager doesn't have access to:
- Previous temporal notes/observations
- Experience history leading up to the judgment
- Multi-step reasoning context
- Temporal coherence information

**Impact**: 
- Explanations are static and don't reference "what happened before"
- Can't explain why a score changed over time
- Can't reference temporal patterns or trends
- Missing context about user journey/experience

**Example Gap**:
```javascript
// Current: Explains single judgment in isolation
await explainManager.explainJudgment(judgment, "Why did you score this 7/10?");
// Answer: "The button has good contrast..." (static)

// Needed: Explains with temporal context
await explainManager.explainJudgment(judgment, "Why did you score this 7/10?", {
  temporalNotes: aggregatedNotes,
  experienceTrace: experienceTrace
});
// Answer: "The button has good contrast. Earlier in the session (at 5s), 
//         the contrast was poor (4/10), but after the user interaction 
//         (at 12s), it improved to 7/10. The improvement suggests..."
```

## Gap 2: VLLM vs LLM Differences in Temporal Explanations

**Problem**: Current implementation treats VLLM explanations like LLM explanations:
- LLMs can cite text passages with line numbers
- VLLMs should cite **visual regions** and **temporal states**
- VLLMs need to explain **which frames/states** influenced decisions
- VLLMs need to explain **temporal relationships** (before/after, during, transitions)

**Research Finding** (from Perplexity research):
- Late interaction in VLLMs requires **modality-temporal factorization**
- Need to explain not just "what" but "when" and "which visual state"
- Temporal judgment attribution is harder: relevance might attach to transitions between frames, not just single frames

**Example Gap**:
```javascript
// Current: Generic explanation
"Score is 7/10 because the button is visible and has good contrast"

// Needed: Temporal-aware VLLM explanation
"Score is 7/10 because:
- At t=0s: Button was hidden (score: 3/10)
- At t=5s: Button appeared but low contrast (score: 5/10)  
- At t=12s: Button now visible with good contrast (score: 7/10)
- The improvement trend (3→5→7) suggests the UI is responding correctly
- Visual evidence: Screenshot at t=12s shows button in top-right (coordinates: 1200, 50)"
```

## Gap 3: Experience Data Integration

**Problem**: Experience traces contain rich context but aren't used in explanations:
- State snapshots not referenced
- Event history not included
- Validation history not considered
- Persona context not carried forward

**Impact**:
- Can't explain "why this judgment given the user's journey"
- Can't reference previous validations in the same session
- Can't explain persona-specific reasoning over time

**Example Gap**:
```javascript
// Current: No experience context
await explainManager.explainJudgment(judgment);

// Needed: Experience-aware explanation
await explainManager.explainJudgment(judgment, question, {
  experienceTrace: {
    sessionId: "session-123",
    events: [...], // Click events, navigation, etc.
    validations: [...], // Previous judgments
    stateSnapshots: [...], // UI states over time
    persona: {...} // Persona context
  }
});
// Answer can reference: "Given that the user (persona: accessibility-focused) 
//                        clicked the 'Skip' button at t=3s, and then navigated 
//                        to the settings page at t=8s, this judgment considers 
//                        the accessibility of the settings page in context of 
//                        the user's journey..."
```

## Gap 4: Multi-Step Reasoning Explanations

**Problem**: When judgments depend on multi-step reasoning or temporal sequences:
- Can't explain "why this step led to that conclusion"
- Can't trace reasoning across multiple temporal windows
- Can't explain temporal coherence or conflicts

**Research Finding** (from Perplexity research):
- Temporal sequences require explaining **temporal relationships** (before/after, during, transitions)
- Multi-step reasoning needs **temporal attribution**: which steps influenced which conclusions
- Modality selection might be **time-varying**: different modalities at different time steps

**Example Gap**:
```javascript
// Current: Single-step explanation
"Why did you score this 7/10?" → "The button has good contrast"

// Needed: Multi-step temporal explanation
"Why did you score this 7/10?" → 
"The score of 7/10 reflects a multi-step improvement:
1. Initial state (t=0s): Button hidden → Score: 3/10
2. After click (t=2s): Button appeared but low contrast → Score: 5/10
3. After hover (t=5s): Contrast improved → Score: 7/10
4. Temporal coherence: The improvement trend (3→5→7) is consistent and suggests 
   the UI is responding correctly to user interactions.
5. Visual evidence: The button in the current screenshot (t=12s) shows good 
   contrast (RGB: 255,255,255 on RGB: 0,0,0 background) at coordinates (1200, 50)."
```

## Gap 5: Logprob Uncertainty in Temporal Context

**Problem**: 
- LLMs can use logprobs to estimate uncertainty at token level
- VLLMs often don't have logprobs (API limitation)
- Without logprobs, harder to explain "confidence in temporal reasoning"
- Can't quantify uncertainty about temporal relationships

**Impact**:
- Can't explain "how confident are you that this improvement trend is real?"
- Can't explain "which temporal step are you most uncertain about?"
- Can't provide confidence breakdown for temporal aspects

## Implementation Needs

### 1. Enhance `explanation-manager.mjs`

**Add temporal context support**:
```javascript
async explainJudgment(vllmJudgment, question = null, options = {}) {
  const {
    temporalNotes = null,        // NEW: Temporal notes
    experienceTrace = null,       // NEW: Experience trace
    aggregatedNotes = null,       // NEW: Pre-aggregated notes
    // ... existing options
  } = options;
  
  // Build explanation prompt with temporal context
  const explanationPrompt = this._buildExplanationPrompt(
    vllmJudgment, 
    question,
    { temporalNotes, experienceTrace, aggregatedNotes } // NEW
  );
  
  // ... rest of implementation
}
```

**Enhance prompt building**:
```javascript
_buildExplanationPrompt(vllmJudgment, question, temporalContext = {}) {
  let prompt = `You previously evaluated this screenshot...`;
  
  // Add temporal context if available
  if (temporalContext.temporalNotes) {
    prompt += `\n\nTEMPORAL CONTEXT:\n`;
    prompt += formatTemporalNotesForPrompt(temporalContext.temporalNotes);
    prompt += `\nWhen explaining, reference specific time points and trends.`;
  }
  
  if (temporalContext.experienceTrace) {
    prompt += `\n\nEXPERIENCE TRACE:\n`;
    prompt += formatExperienceTraceForPrompt(temporalContext.experienceTrace);
    prompt += `\nConsider the user's journey and previous states when explaining.`;
  }
  
  // ... rest of prompt building
}
```

### 2. Integrate with `human-validation-manager.mjs`

**Pass experience trace to explanations**:
```javascript
// In collectVLLMJudgment, store experience trace
const vllmJudgment = {
  // ... existing fields
  experienceTrace: context.experienceTrace || null, // NEW
  temporalNotes: context.temporalNotes || null      // NEW
};

// When requesting explanation, pass experience trace
async explainJudgmentWithContext(judgmentId, question) {
  const judgment = this.vllmJudgments.find(j => j.id === judgmentId);
  const explanationManager = getExplanationManager();
  
  return await explanationManager.explainJudgment(
    judgment,
    question,
    {
      temporalNotes: judgment.temporalNotes,
      experienceTrace: judgment.experienceTrace
    }
  );
}
```

### 3. Add Temporal Explanation Helpers

**Create `src/temporal-explanation-helpers.mjs`**:
```javascript
export function formatTemporalNotesForPrompt(aggregatedNotes) {
  // Format temporal notes for explanation prompts
  // Include: windows, coherence, trends, conflicts
}

export function formatExperienceTraceForPrompt(experienceTrace) {
  // Format experience trace for explanation prompts
  // Include: events, validations, state snapshots, persona
}

export function extractTemporalEvidence(judgment, temporalNotes) {
  // Extract which temporal states/frames influenced the judgment
  // Return: time points, visual regions, trends
}
```

### 4. Enhance VLLM-Specific Explanations

**Add visual and temporal citation support**:
```javascript
// In explanation prompts, request structured output:
prompt += `\n\nWhen explaining, provide:
1. Visual citations: Reference specific image regions (coordinates, descriptions)
2. Temporal citations: Reference specific time points and states
3. Temporal relationships: Explain before/after/during relationships
4. Experience context: Reference user journey and previous states`;
```

## Research Questions to Address

1. **How should late interaction handle temporal sequences?**
   - Should MaxSim operations be restricted temporally?
   - How to compute similarity across frame boundaries?
   - How to handle temporal dependencies in retrieval?

2. **How to explain temporal judgment attribution?**
   - Which frames/states influenced the decision?
   - How to explain transitions between states?
   - How to explain temporal coherence or conflicts?

3. **How to integrate experience data into explanations?**
   - Which parts of experience trace are most relevant?
   - How to summarize long experience traces?
   - How to handle persona-specific temporal reasoning?

4. **How to quantify uncertainty in temporal reasoning?**
   - Without logprobs, how to estimate confidence in temporal relationships?
   - How to identify which temporal steps are most uncertain?
   - How to provide confidence breakdown for temporal aspects?

## Priority

1. **High**: Integrate temporal notes into explanation prompts
2. **High**: Pass experience trace to explanation manager
3. **Medium**: Add temporal citation support (time points, visual regions)
4. **Medium**: Enhance prompts to request temporal-aware explanations
5. **Low**: Research temporal uncertainty quantification without logprobs

## References

- Perplexity research: Late interaction in VLLMs requires modality-temporal factorization
- Perplexity research: Temporal judgment attribution is harder for VLLMs
- Current implementation: `src/explanation-manager.mjs`, `src/temporal.mjs`, `src/experience-tracer.mjs`

