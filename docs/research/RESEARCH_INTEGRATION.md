# Research Integration: Paper References and Implementation

## Overview

This document tracks research paper references and their integration into the codebase. It ensures research-backed implementations are properly cited and validated.

## Integrated Research Papers

### 1. Temporal Decision-Making

**Papers:**
- **Efficient Sequential Decision Making** (arXiv:2406.12125) - *Loosely related*: Uses temporal dependency concepts, not the core online model selection algorithm
- **Human Time Perception** (PMC research) - *Inspired by*: Human perception time scales
- **Powers of 10: Time Scales in UX** (NN/g) - *Inspired by*: Multi-scale time windows

**Implementation:**
- `src/temporal-decision.mjs` - Multi-scale temporal aggregation (inspired by temporal aspects)
- `src/temporal-constants.mjs` - Research-based time scales
- `src/temporal-batch-optimizer.mjs` - Sequential decision context (loosely related to sequential decision concepts)

**Status:** ✅ Integrated with citations (clarified as "inspired by" / "loosely related" where appropriate)

### 2. Explicit Rubrics

**Paper:**
- **LLMs-as-Judges Survey** (arXiv:2412.05579) - 10-20% reliability improvement

**Implementation:**
- `src/rubrics.mjs` - Rubric system
- `src/prompt-composer.mjs` - Rubric integration
- `src/judge.mjs` - Rubric usage

**Status:** ✅ Integrated with citation

### 3. Pair Comparison

**Paper:**
- **MLLM-as-a-Judge** (arXiv:2402.04788) - More reliable than absolute scoring

**Implementation:**
- `src/pair-comparison.mjs` - Pair comparison system

**Status:** ✅ Integrated with citation

### 4. Position Bias

**Paper:**
- **Position Bias in LLM Evaluation** (arXiv:2508.02020) - 70-80% preference for first answer

**Implementation:**
- `src/position-counterbalance.mjs` - Counter-balancing system

**Status:** ✅ Integrated with citation

### 5. Spearman Correlation

**Paper:**
- **LLM Evaluation Metrics** (arXiv:2506.02945) - More appropriate for ordinal ratings

**Implementation:**
- `src/metrics.mjs` - Spearman correlation implementation

**Status:** ✅ Integrated with citation

### 6. Ensemble Judging

**Paper:**
- **Optimal LLM Aggregation** (arXiv:2510.01499) - Inverse logistic weighting

**Implementation:**
- `src/ensemble-judge.mjs` - Ensemble judging with optimal weighting

**Status:** ✅ Integrated with citation

### 7. Hallucination Detection

**Papers:**
- **Hallucination Detection in LLMs** (arXiv:2506.19513)
- **Multimodal Hallucination Evaluation** (arXiv:2507.19024)
- **Visual Grounding in VLMs** (arXiv:2509.10345)

**Implementation:**
- `src/hallucination-detector.mjs` - Hallucination detection

**Status:** ✅ Integrated with citations

### 8. Few-Shot Examples

**Paper:**
- **Few-Shot Optimization** (arXiv:2503.04779) - ES-KNN and many-shot

**Implementation:**
- `src/dynamic-few-shot.mjs` - Dynamic few-shot example selection

**Status:** ✅ Integrated with citation

## Research Papers to Integrate

### High Priority

1. **VETL: LVLM-Driven End-to-End Web Testing** (arXiv:2410.12157)
   - Visual Q&A for element selection
   - Text input generation
   - **Status:** ⚠️ Not yet integrated

2. **MLLM as a UI Judge** (arXiv:2510.08783)
   - Dimension-specific alignment
   - UI evaluation benchmarking
   - **Status:** ⚠️ Partially integrated (UI evaluation exists, but not dimension-specific)

3. **WebSight: Vision-First Architecture** (arXiv:2508.16987)
   - High-precision visual grounding
   - Vision-first approach
   - **Status:** ⚠️ Vision-first aligned, but visual grounding could be enhanced

### Medium Priority

4. **WebVIA: Web-based Vision-Language Agentic Framework** (arXiv:2511.06251)
   - Interaction graphs
   - State discovery and transitions
   - **Status:** ⚠️ State discovery partially addressed

5. **WALT: Web Agents that Learn Tools** (arXiv:2510.01524)
   - Set-of-Mark (SoM) visual prompts
   - Trajectory-based retrieval
   - **Status:** ⚠️ Not yet integrated

6. **PersonaTeaming: Automated AI Red-Teaming** (arXiv:2509.03728v3)
   - Automated persona generation
   - Prompt mutation
   - **Status:** ⚠️ Personas exist, but not automated generation

### Low Priority

7. **VLM-Fuzz: Vision Language Model Assisted UI Testing** (arXiv:2504.11675)
   - Mobile UI testing
   - Fuzzing strategies
   - **Status:** ⚠️ Not yet integrated

8. **A Survey on Web Testing** (arXiv:2503.05378)
   - Comprehensive survey reference
   - **Status:** ✅ Referenced in documentation

## Variable Goals/Prompts for Games

### Research Context

**Goal-Conditioned Policies:**
- Research shows games benefit from variable goals
- Flexible task specification improves evaluation
- Dynamic objective functions adapt to context

**How Others Do It:**

1. **String Prompts** - Direct prompt text (simple, flexible)
2. **Goal Objects** - Structured goals with criteria (systematic)
3. **Goal Arrays** - Multiple goals evaluated together (comprehensive)
4. **Function Generators** - Dynamic goal generation (adaptive)

### Our Implementation

**File:** `src/game-goal-prompts.mjs`

**Features:**
- ✅ Accepts string prompts (with context interpolation)
- ✅ Accepts goal objects (structured with criteria)
- ✅ Accepts goal arrays (multiple goals)
- ✅ Accepts functions (dynamic generation)
- ✅ Predefined goal templates (fun, accessibility, performance, balance, visuals, controls)
- ✅ Context-aware (gameState, previousState, persona)

**Usage Examples:**

```javascript
// 1. String prompt (simple)
const prompt = generateGamePrompt(
  'Evaluate if the game is fun. Current score: ${gameState.score}',
  { gameState: { score: 100 } }
);

// 2. Goal object (structured)
const prompt = generateGamePrompt({
  description: 'Evaluate game accessibility',
  criteria: ['Keyboard navigation', 'Visual indicators', 'Audio feedback'],
  focus: ['accessibility', 'keyboard-navigation'],
  questions: ['Can it be played with keyboard only?']
}, { gameState });

// 3. Goal array (multiple goals)
const prompt = generateGamePrompt([
  'Is the game fun?',
  'Are controls responsive?',
  'Is it accessible?'
], { gameState });

// 4. Predefined goal template
const goal = createGameGoal('accessibility');
const prompt = generateGamePrompt(goal, { gameState });

// 5. Multiple predefined goals
const goals = createGameGoals(['fun', 'accessibility', 'performance']);
const prompt = generateGamePrompt(goals, { gameState });

// 6. Function (dynamic)
const prompt = generateGamePrompt(
  (context) => `Evaluate ${context.gameState.level} level gameplay`,
  { gameState: { level: 5 } }
);
```

**Integration:**
- `generateGameplayPrompt()` now uses variable goal system
- Backward compatible with legacy focus strings
- Works with `experiencePageAsPersona()` and `validateScreenshot()`

## Quality Assurance

### Code Quality

**Implemented:**
- ✅ Type checking and validation
- ✅ Error handling
- ✅ Fallback mechanisms
- ✅ Backward compatibility
- ✅ Documentation

**Testing:**
- ✅ Module loading verified
- ⚠️ Unit tests needed
- ⚠️ Integration tests needed

### Research Alignment

**Validated:**
- ✅ Research citations in code
- ✅ Research-based implementations
- ✅ Documentation references

**Needs Validation:**
- ⚠️ **CRITICAL**: Research claims (10-20% improvements) not yet validated in our codebase
- ⚠️ **CRITICAL**: No ablation studies to verify which techniques actually help
- ⚠️ Some research methods not fully integrated
- ⚠️ Benchmark comparisons needed

### Ablation Studies

**Status**: ⚠️ **Not Yet Performed**

We've implemented many techniques from arXiv papers, but we haven't validated which ones actually improve outcomes in our specific use case. See `docs/features/ABLATION_STUDY_PLAN.md` for the plan to:

1. Test each technique in isolation
2. Measure actual impact vs. baseline
3. Remove techniques that don't help
4. Reduce complexity while maintaining or improving accuracy

**Framework**: `evaluation/ablation-framework.mjs` - Ready to use, needs test dataset with ground truth.

## Next Steps

### Immediate

1. **Add Unit Tests** for variable goal system
2. **Add Integration Tests** for game goal prompts
3. **Validate Research Claims** with benchmarks

### Short Term

4. **Integrate VETL** visual Q&A approach
5. **Add Dimension-Specific Alignment** (MLLM as a UI Judge)
6. **Enhance Visual Grounding** (WebSight approach)

### Long Term

7. **Benchmark Integration** - VisualWebBench, Mind2Web, ScreenshotVQA
8. **Research Contribution** - Publish results
9. **Community Feedback** - Validate with users

## Conclusion

**Status:**
- ✅ Core research integrated with citations
- ✅ Variable goals/prompts for games implemented
- ✅ Quality code with error handling
- ⚠️ Some research papers not yet integrated
- ⚠️ Research claims need validation

**Priority:** Make it work well first, then validate research claims.

