# Unused Code Analysis: What Should Be Used

## Summary

After researching the codebase, several features marked as "unused" are actually **used internally** or **should be used** for better results. This document clarifies what's actually unused vs. what should be integrated.

## Actually Used (Not Unused)

### ✅ `selectTopWeightedNotes` - **USED**
- **Location**: `src/prompt-composer.mjs:108`
- **Usage**: Automatically prunes temporal notes before aggregation
- **Status**: ✅ Already integrated, working as intended
- **Note**: The "unused" label in `QUEERAOKE_CURRENT_USAGE.md` refers to queeraoke not using it directly, but it's used internally by the library

### ✅ `pruneTemporalNotes` - **USED**
- **Location**: `src/temporal-preprocessor.mjs:215, 486`
- **Usage**: Used in temporal preprocessing for high-Hz/low-Hz activity patterns
- **Status**: ✅ Already integrated

## Should Be Used (Integration Opportunities)

### 🎯 `TemporalDecisionManager` - **SHOULD BE USED**
- **Purpose**: Decides **when** to prompt based on temporal context (not just how to aggregate)
- **Research**: arXiv:2406.12125 - Only 1.5% LLM calls needed through strategic selection
- **Current State**: Implemented but not used in validation workflows
- **When to Use**:
  - Interactive experiences with rapid state changes
  - Game testing where not every frame needs evaluation
  - Reducing LLM costs by prompting only when needed
- **Integration**:
```javascript
import { TemporalDecisionManager } from 'ai-visual-test';

const decisionManager = new TemporalDecisionManager();
const decision = decisionManager.shouldPrompt(currentState, previousState, notes);

if (decision.shouldPrompt) {
  const result = await validateScreenshot(screenshotPath, prompt, {
    temporalNotes: notes
  });
}
```

### 🎯 `EnsembleJudge` - **SHOULD BE USED FOR BETTER ACCURACY**
- **Purpose**: Multiple LLM judges with consensus voting
- **Research**: arXiv:2510.01499 - Optimal ensemble weighting improves accuracy
- **Current State**: Implemented, tested, but not used in production workflows
- **When to Use**:
  - High-stakes evaluations where accuracy matters
  - When you have multiple providers available (Gemini, OpenAI, Claude)
  - Reducing bias and improving reliability
- **Integration**:
```javascript
import { createEnsembleJudge } from 'ai-visual-test';

const ensemble = createEnsembleJudge(['gemini', 'openai'], {
  votingMethod: 'optimal',
  judgeAccuracies: [0.95, 0.90] // If known
});

const result = await ensemble.evaluate(screenshotPath, prompt);
// Result includes: score, confidence, agreement, individual judgments
```

### 🎯 `TemporalBatchOptimizer` - **SHOULD BE USED FOR SEQUENTIAL EVALUATIONS**
- **Purpose**: Batching with temporal dependency awareness
- **Difference from `BatchOptimizer`**: 
  - `BatchOptimizer`: General-purpose, no dependency tracking
  - `TemporalBatchOptimizer`: Prioritizes independent requests, tracks dependencies
- **When to Use**:
  - Sequential evaluations where order matters
  - Game testing with state dependencies
  - When you need to process independent requests first
- **Integration**:
```javascript
import { TemporalBatchOptimizer } from 'ai-visual-test';

const optimizer = new TemporalBatchOptimizer({
  maxConcurrency: 3,
  batchSize: 5
});

// Add requests with dependencies
await optimizer.addTemporalRequest(screenshot1, prompt1, context1, []);
await optimizer.addTemporalRequest(screenshot2, prompt2, context2, [screenshot1]);
const results = await optimizer.processAll();
```

### 🎯 `HumanValidationManager` - **SHOULD BE USED FOR HUMAN FEEDBACK**
- **Purpose**: Collects and manages human feedback for calibration
- **Current State**: Implemented but not integrated into validation workflows
- **When to Use**:
  - When you need human feedback to improve VLLM judgments
  - Calibration workflows
  - Building training datasets from human feedback
- **Integration**: See `docs/human-validation/HUMAN_VALIDATION_INTEGRATION.md`

### 🎯 `ExplanationManager` - **SHOULD BE USED FOR LATE INTERACTION**
- **Purpose**: Explains VLLM judgments after they're made (late interaction)
- **Current State**: Implemented but not integrated
- **When to Use**:
  - When humans need to understand why VLLM scored something a certain way
  - Building trust and transparency
  - Debugging unexpected judgments
- **Integration**: See `docs/misc/LATE_INTERACTION_TEMPORAL_GAPS.md`

## Questionable (Needs Use Case)

### ❓ `aggregateMultiScale` - **QUESTIONABLE**
- **Purpose**: Multi-scale temporal aggregation
- **Current State**: Implemented, but no clear use case demonstrated
- **Research**: Based on temporal cognition research, but utility unclear
- **Recommendation**: 
  - Find a real use case, OR
  - Mark as experimental, OR
  - Remove if no use case found

### ❓ `ExperienceTrace` - **QUESTIONABLE**
- **Purpose**: Tracks experience traces with session IDs
- **Current State**: Implemented but not used in explanations or validation
- **Recommendation**: 
  - Integrate with `ExplanationManager` for temporal context in explanations, OR
  - Remove if not needed

## Recommendations

### Immediate Actions
1. ✅ **Document that `selectTopWeightedNotes` and `pruneTemporalNotes` are used internally**
2. 🎯 **Create integration examples for `TemporalDecisionManager`**
3. 🎯 **Add `EnsembleJudge` to high-stakes evaluation workflows**
4. 🎯 **Use `TemporalBatchOptimizer` for sequential evaluations**

### Short-term
5. 🎯 **Integrate `HumanValidationManager` into validation workflows**
6. 🎯 **Integrate `ExplanationManager` for late interaction**
7. ❓ **Find use case for `aggregateMultiScale` or mark as experimental**

### Long-term
8. ❓ **Evaluate `ExperienceTrace` utility and integrate or remove**

## Conclusion

**Not Actually Unused:**
- `selectTopWeightedNotes` - Used in `prompt-composer.mjs`
- `pruneTemporalNotes` - Used in `temporal-preprocessor.mjs`

**Should Be Used:**
- `TemporalDecisionManager` - For when-to-prompt decisions
- `EnsembleJudge` - For better accuracy (research-backed)
- `TemporalBatchOptimizer` - For sequential evaluations with dependencies
- `HumanValidationManager` - For human feedback collection
- `ExplanationManager` - For late interaction explanations

**Questionable:**
- `aggregateMultiScale` - Needs use case or removal
- `ExperienceTrace` - Needs integration or removal

