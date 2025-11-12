# Queeraoke Migration Guide: Research Enhancements

## Overview

This guide helps migrate queeraoke tests to use the new research-enhanced validation functions, temporal decision logic, and note pruning features from `ai-visual-test`.

## Migration Benefits

### 1. Research Enhancements
- **10-20% reliability improvement** with explicit rubrics (arXiv:2412.05579)
- **Position bias elimination** with counter-balancing (arXiv:2508.02020)
- **Quality gap analysis** for equivocal cases (arXiv:2406.07791)
- **Verbosity bias mitigation** (arXiv:2407.01085)

### 2. Temporal Decision Logic
- **Smart prompting**: Only prompt when context is sufficient
- **Coherence-based decisions**: Wait for stable context before prompting
- **Urgency detection**: Prompt immediately on critical events

### 3. Note Pruning
- **Reduced prompt size**: Keep only top-weighted notes
- **Better performance**: Faster API calls with smaller prompts
- **Improved relevance**: Focus on most important temporal context

## Migration Patterns

### Pattern 1: Static Screenshot Validation

#### Before
```javascript
import { validateScreenshot, createConfig } from 'ai-visual-test';

const config = createConfig();
const result = await validateScreenshot(screenshotPath, prompt, {
  testType: 'visual-regression',
  viewport: { width: 1280, height: 720 }
});
```

#### After (Option A: Explicit Rubric)
```javascript
import { validateWithExplicitRubric, createConfig } from 'ai-visual-test';

const config = createConfig();
const result = await validateWithExplicitRubric(screenshotPath, prompt, {
  testType: 'visual-regression',
  viewport: { width: 1280, height: 720 },
  useDefaultRubric: true  // 10-20% reliability improvement
});
```

#### After (Option B: All Research Enhancements)
```javascript
import { validateWithAllResearchEnhancements, createConfig } from 'ai-visual-test';

const config = createConfig();
const result = await validateWithAllResearchEnhancements(screenshotPath, prompt, {
  testType: 'visual-regression',
  viewport: { width: 1280, height: 720 },
  enableRubrics: true,
  enableBiasDetection: true,
  enableBiasMitigation: true
});
```

**Benefits**:
- ✅ 10-20% reliability improvement (explicit rubrics)
- ✅ Position bias detection and mitigation
- ✅ Quality gap analysis for equivocal cases
- ✅ Verbosity bias mitigation

### Pattern 2: Interactive Gameplay Testing

#### Before
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

#### After (With Temporal Decision Logic + Note Pruning)
```javascript
import { 
  validateScreenshot,
  aggregateTemporalNotes,
  captureTemporalScreenshots,
  TemporalDecisionManager,
  selectTopWeightedNotes
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

// NEW: Prune to top-weighted notes (reduces prompt size)
const topNotes = await selectTopWeightedNotes(notes, { topN: 10 });

// NEW: Use temporal decision manager to decide when to prompt
const decisionManager = new TemporalDecisionManager({
  minNotesForPrompt: 3,
  coherenceThreshold: 0.5
});

// Track previous state for decision logic
let previousState = null;

for (const screenshot of temporalScreenshots) {
  const currentState = {
    score: screenshot.score,
    issues: screenshot.issues || [],
    gameState: screenshot.gameState
  };

  // Decide if we should prompt now
  const decision = decisionManager.shouldPrompt(
    currentState,
    previousState,
    topNotes,
    {
      stage: 'gameplay',
      testType: 'interactive'
    }
  );

  if (decision.shouldPrompt) {
    console.log(`Prompting: ${decision.reason} (urgency: ${decision.urgency})`);

    // Aggregate pruned notes
    const aggregated = aggregateTemporalNotes(topNotes);

    // Validate with temporal context
    const result = await validateScreenshot(screenshot.path, prompt, {
      testType: 'gameplay',
      temporalNotes: aggregated
    });

    // Update previous state
    previousState = currentState;
  } else {
    console.log(`Skipping prompt: ${decision.reason}`);
  }
}
```

**Benefits**:
- ✅ Smart prompting (only when context is sufficient)
- ✅ Reduced prompt size (top 10 notes instead of all)
- ✅ Coherence-based decisions (wait for stable context)
- ✅ Urgency detection (prompt immediately on critical events)

### Pattern 3: Multi-Modal Validation

#### Before
```javascript
import { 
  extractRenderedCode, 
  multiModalValidation 
} from 'ai-visual-test';

const renderedCode = await extractRenderedCode(page);
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

#### After (With Research Enhancements)
```javascript
import { 
  extractRenderedCode, 
  validateWithAllResearchEnhancements
} from 'ai-visual-test';

const renderedCode = await extractRenderedCode(page);

// Use research-enhanced validation with multi-modal context
const result = await validateWithAllResearchEnhancements(
  screenshotPath,
  prompt,
  {
    testType: 'multi-modal',
    renderedCode: renderedCode,
    enableRubrics: true,
    enableBiasDetection: true,
    enableBiasMitigation: true
  }
);
```

**Benefits**:
- ✅ Research enhancements applied to multi-modal validation
- ✅ Bias detection and mitigation
- ✅ Explicit rubrics for better reliability

## Step-by-Step Migration

### Step 1: Identify Test Patterns

Run this to find all `validateScreenshot` usages:
```bash
cd /Users/arc/Documents/dev/queeraoke
grep -r "validateScreenshot" test/ | wc -l
```

### Step 2: Categorize Tests

1. **Static tests** (no temporal notes) → Use `validateWithExplicitRubric`
2. **Interactive tests** (with temporal notes) → Use temporal decision logic + note pruning
3. **Multi-modal tests** → Use `validateWithAllResearchEnhancements`

### Step 3: Update Imports

```javascript
// Old
import { validateScreenshot, createConfig } from 'ai-visual-test';

// New (for research enhancements)
import { 
  validateWithExplicitRubric,
  validateWithAllResearchEnhancements,
  createConfig 
} from 'ai-visual-test';

// New (for temporal decision logic)
import { 
  TemporalDecisionManager,
  selectTopWeightedNotes
} from 'ai-visual-test';
```

### Step 4: Update Function Calls

Replace `validateScreenshot` with appropriate research-enhanced function based on test type.

### Step 5: Add Temporal Decision Logic (for interactive tests)

1. Create `TemporalDecisionManager` instance
2. Track previous state
3. Use `shouldPrompt()` to decide when to validate
4. Prune notes with `selectTopWeightedNotes()`

### Step 6: Test and Validate

Run tests to ensure:
- ✅ Same or better scores
- ✅ Reduced API calls (for temporal decision logic)
- ✅ Faster execution (for note pruning)
- ✅ Better reliability (for research enhancements)

## Example: Complete Migration

### Before: `visual-regression-vllm.test.mjs`
```javascript
import { validateScreenshot, createConfig } from 'ai-visual-test';

const config = createConfig();
const VLLM_ENABLED = config.enabled;

test('payment screen: visual consistency', async ({ page, baseURL }) => {
  // ... setup ...
  
  if (VLLM_ENABLED) {
    const screenshotPath = `test-results/vllm-payment-screen-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, type: 'png' });
    
    const result = await validateScreenshot(screenshotPath, prompt, {
      testType: 'visual-regression'
    });
    
    expect(result.score).toBeGreaterThanOrEqual(7);
  }
});
```

### After: `visual-regression-vllm.test.mjs`
```javascript
import { 
  validateWithExplicitRubric, 
  createConfig 
} from 'ai-visual-test';

const config = createConfig();
const VLLM_ENABLED = config.enabled;

test('payment screen: visual consistency', async ({ page, baseURL }) => {
  // ... setup ...
  
  if (VLLM_ENABLED) {
    const screenshotPath = `test-results/vllm-payment-screen-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, type: 'png' });
    
    // Use explicit rubric for 10-20% reliability improvement
    const result = await validateWithExplicitRubric(screenshotPath, prompt, {
      testType: 'visual-regression',
      useDefaultRubric: true
    });
    
    expect(result.score).toBeGreaterThanOrEqual(7);
    
    // Check research enhancements
    if (result.researchEnhancements) {
      console.log('Research enhancements applied:', result.researchEnhancements);
    }
  }
});
```

## Migration Checklist

- [ ] Update imports to include research-enhanced functions
- [ ] Replace `validateScreenshot` with `validateWithExplicitRubric` for static tests
- [ ] Replace `validateScreenshot` with `validateWithAllResearchEnhancements` for comprehensive tests
- [ ] Add temporal decision logic for interactive tests
- [ ] Add note pruning for temporal tests
- [ ] Test all migrated tests
- [ ] Compare scores before/after migration
- [ ] Document any score changes or improvements

## Backward Compatibility

All existing `validateScreenshot` calls will continue to work. The research enhancements are opt-in:

- ✅ `validateScreenshot` - Still works (no changes)
- ✅ `validateWithExplicitRubric` - New, opt-in
- ✅ `validateWithAllResearchEnhancements` - New, opt-in
- ✅ `TemporalDecisionManager` - New, opt-in
- ✅ `selectTopWeightedNotes` - New, opt-in

## Performance Impact

### Research Enhancements
- **Cost**: Slightly higher (more prompt tokens for rubrics)
- **Reliability**: 10-20% improvement
- **Latency**: Minimal increase (~50-100ms)

### Temporal Decision Logic
- **Cost**: Lower (fewer API calls)
- **Reliability**: Better (only prompt when context is sufficient)
- **Latency**: Lower (fewer calls = faster overall)

### Note Pruning
- **Cost**: Lower (smaller prompts)
- **Reliability**: Same or better (more relevant context)
- **Latency**: Lower (smaller prompts = faster API calls)

## Troubleshooting

### Issue: Scores are different after migration
**Solution**: This is expected. Research enhancements may adjust scores based on bias detection. Check `result.biasMitigation` for details.

### Issue: Temporal decision logic skips too many prompts
**Solution**: Adjust `coherenceThreshold` and `minNotesForPrompt`:
```javascript
const decisionManager = new TemporalDecisionManager({
  minNotesForPrompt: 2,  // Lower threshold
  coherenceThreshold: 0.3  // Lower threshold
});
```

### Issue: Note pruning removes important notes
**Solution**: Increase `topN`:
```javascript
const topNotes = await selectTopWeightedNotes(notes, { topN: 20 });
```

## Next Steps

1. Start with static tests (easiest migration)
2. Add research enhancements incrementally
3. Test temporal decision logic on interactive tests
4. Monitor performance and adjust thresholds
5. Document any issues or improvements

