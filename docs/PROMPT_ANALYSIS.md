# Prompt Usage Analysis: Critical Review

## Executive Summary

After comprehensive review, **5 critical inconsistencies** and **3 missing integrations** identified in prompt construction across testing types. Prompts are built differently in each module without a unified strategy, leading to:
- Inconsistent evaluation quality
- Missing rubric integration
- Temporal context not properly included
- Persona prompts duplicated with different formats
- No systematic prompt composition

## Current State Analysis

### 1. Single Image Evaluation (`judge.mjs`)

**Current Implementation:**
```javascript
buildPrompt(prompt, context = {}, isMultiImage = false) {
  // Basic context addition
  // + multi-image instructions if applicable
  // ❌ NO rubric integration
  // ❌ NO temporal notes integration
  // ❌ NO persona-specific formatting
}
```

**Issues:**
- Rubrics exist but aren't integrated
- Temporal notes formatting exists but isn't used
- Persona context passed but not formatted

### 2. Pair Comparison (`pair-comparison.mjs`)

**Current Implementation:**
```javascript
buildComparisonPrompt(basePrompt, context) {
  // Comparison-specific instructions
  // ❌ NO rubric integration
  // ❌ NO structured JSON format enforcement
  // ❌ NO few-shot examples for comparison
}
```

**Issues:**
- Comparison instructions are generic
- No research-backed comparison format (MLLM-as-a-Judge)
- Missing few-shot examples for pair comparison

### 3. Multi-Modal Validation (`multi-modal.mjs`)

**Current Implementation:**
```javascript
buildPersonaPrompt(persona, renderedCode, gameState) {
  // Persona perspective
  // + rendered code
  // + game state
  // ❌ NO rubric integration
  // ❌ NO temporal context
  // ❌ Different format than dynamic-prompts.mjs
}
```

**Issues:**
- Duplicate persona prompt building (different from `dynamic-prompts.mjs`)
- No rubric for multi-modal evaluation
- Temporal notes not included even when available

### 4. Temporal Aggregation (`temporal.mjs`)

**Current Implementation:**
```javascript
formatNotesForPrompt(aggregated) {
  // Formats temporal notes
  // ❌ NOT integrated into judge.mjs.buildPrompt()
  // ❌ NOT used in multi-modal prompts
  // ❌ NOT used in pair comparison
}
```

**Issues:**
- Function exists but is orphaned
- Temporal context not systematically included
- No integration with other prompt builders

### 5. Rubrics (`rubrics.mjs`)

**Current Implementation:**
```javascript
buildRubricPrompt(rubric, includeDimensions) {
  // Rubric + few-shot examples
  // ❌ NOT integrated into judge.mjs.buildPrompt()
  // ❌ NOT used in pair comparison
  // ❌ NOT used in multi-modal
}
```

**Issues:**
- Research shows 10-20% reliability improvement with explicit rubrics
- Currently optional, not default
- Not composed with other prompt components

### 6. Dynamic Prompts (`dynamic-prompts.mjs`)

**Current Implementation:**
```javascript
generateDynamicPrompt(context) {
  // Context-aware prompt generation
  // ❌ Different persona format than multi-modal.mjs
  // ❌ Not used by judge.mjs
  // ❌ Not integrated with rubrics
}
```

**Issues:**
- Duplicate persona prompt building
- Not integrated into core evaluation flow
- Missing rubric composition

## Critical Gaps

### Gap 1: No Unified Prompt Composition Strategy

**Problem:** Each module builds prompts independently, leading to:
- Inconsistent evaluation quality
- Missing research-backed components (rubrics, few-shot examples)
- Temporal context not included when available
- Persona formatting duplicated

**Impact:** 
- 10-20% reliability loss (missing rubrics)
- Temporal coherence not evaluated
- Persona perspectives inconsistent

### Gap 2: Rubrics Not Integrated

**Problem:** `buildRubricPrompt()` exists but isn't used by default in:
- `judge.mjs.buildPrompt()`
- `pair-comparison.mjs.buildComparisonPrompt()`
- `multi-modal.mjs.buildPersonaPrompt()`

**Research Evidence:**
- Explicit rubrics improve reliability by 10-20% (LLMs-as-Judges Survey)
- Few-shot examples improve consistency
- Should be default, not optional

### Gap 3: Temporal Context Not Systematically Included

**Problem:** `formatNotesForPrompt()` exists but isn't integrated into:
- Single image evaluation
- Pair comparison
- Multi-modal validation

**Impact:**
- Temporal coherence not evaluated
- Sequential context lost
- Multi-scale aggregation not utilized

### Gap 4: Persona Prompts Duplicated

**Problem:** Two different implementations:
- `multi-modal.mjs.buildPersonaPrompt()` - includes rendered code, game state
- `dynamic-prompts.mjs.buildPersonaPrompt()` - includes experience notes

**Impact:**
- Inconsistent persona evaluation
- Missing context in one or the other
- Maintenance burden

### Gap 5: Pair Comparison Missing Research-Backed Format

**Problem:** `buildComparisonPrompt()` is generic, missing:
- Structured JSON format enforcement (MLLM-as-a-Judge)
- Few-shot examples for comparison
- Position randomization instructions

**Research Evidence:**
- Pair comparison shows "remarkable human-like discernment" (MLLM-as-a-Judge)
- Structured format improves consistency
- Few-shot examples improve reliability

## Recommended Solution

### Unified Prompt Composition System

Create a systematic prompt composition strategy:

```javascript
// Proposed: src/prompt-composer.mjs
export function composePrompt(basePrompt, options = {}) {
  const {
    rubric = DEFAULT_RUBRIC,
    includeRubric = true, // Default true (research-backed)
    temporalNotes = null,
    persona = null,
    isMultiImage = false,
    isComparison = false,
    context = {}
  } = options;
  
  let prompt = basePrompt;
  
  // 1. Add rubric (research: 10-20% improvement)
  if (includeRubric) {
    prompt = `${buildRubricPrompt(rubric)}\n\n${prompt}`;
  }
  
  // 2. Add temporal context if available
  if (temporalNotes) {
    prompt = `${prompt}\n\n${formatNotesForPrompt(temporalNotes)}`;
  }
  
  // 3. Add persona perspective if provided
  if (persona) {
    prompt = `${prompt}\n\n${buildPersonaContext(persona)}`;
  }
  
  // 4. Add comparison instructions if multi-image
  if (isMultiImage || isComparison) {
    prompt = `${prompt}\n\n${buildComparisonInstructions(isComparison)}`;
  }
  
  // 5. Add context (testType, viewport, gameState)
  prompt = addContext(prompt, context);
  
  return prompt;
}
```

### Integration Points

1. **judge.mjs.buildPrompt()**: Use `composePrompt()` instead of manual building
2. **pair-comparison.mjs**: Use `composePrompt()` with `isComparison=true`
3. **multi-modal.mjs**: Use `composePrompt()` with persona and rendered code
4. **temporal.mjs**: Ensure `formatNotesForPrompt()` is used via `composePrompt()`

## Evidence-Based Improvements

### 1. Default Rubric Integration (HIGH PRIORITY)

**Research:** Explicit rubrics improve reliability by 10-20% (LLMs-as-Judges Survey, arXiv:2412.05579)

**Implementation:**
- Make rubrics default in `composePrompt()`
- Allow opt-out via `includeRubric: false`
- Test with/without rubrics to validate improvement

### 2. Temporal Context Integration (HIGH PRIORITY)

**Research:** Temporal coherence checking improves consistency (temporal aggregation research)

**Implementation:**
- Integrate `formatNotesForPrompt()` into `composePrompt()`
- Include temporal context when available
- Test temporal coherence evaluation

### 3. Unified Persona Prompt Format (MEDIUM PRIORITY)

**Research:** Consistent persona formatting improves evaluation consistency

**Implementation:**
- Single `buildPersonaContext()` function
- Include all relevant context (rendered code, game state, experience notes)
- Use in all persona evaluations

### 4. Pair Comparison Format (MEDIUM PRIORITY)

**Research:** Structured JSON format improves pair comparison reliability (MLLM-as-a-Judge)

**Implementation:**
- Enforce structured JSON format in comparison prompts
- Add few-shot examples for comparison
- Include position randomization instructions

## Testing Strategy

1. **A/B Testing**: Compare prompts with/without rubrics
2. **Temporal Coherence**: Test temporal context inclusion
3. **Persona Consistency**: Test unified persona format
4. **Pair Comparison**: Test structured format vs. generic

## Next Steps

1. Create `src/prompt-composer.mjs` with unified composition
2. Integrate into `judge.mjs`, `pair-comparison.mjs`, `multi-modal.mjs`
3. Add tests for prompt composition
4. Validate improvements with evaluation metrics

