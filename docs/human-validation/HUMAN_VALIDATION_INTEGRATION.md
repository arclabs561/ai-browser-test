# Human Validation Integration

## Overview

The human validation system is now **cleverly integrated** into the evaluation pipeline. It's:
- **Non-blocking**: Doesn't slow down evaluations
- **Automatic**: Collects VLLM judgments when enabled
- **Smart sampling**: Requests human validation for interesting cases
- **Learning**: Automatically calibrates based on collected data
- **Seamless**: Works with all existing systems (batching, temporal, personas)

## Quick Start

### 1. Enable Human Validation

**Option A: Queue for Review (Recommended)**

```javascript
import { initHumanValidation } from 'ai-visual-test';

// Initialize without validator function - judgments will be queued for review
const manager = initHumanValidation({
  enabled: true,
  autoCollect: true, // Automatically collect VLLM judgments
  smartSampling: true, // Only request human validation for interesting cases
  // No humanValidatorFn - judgments are queued for review via real-human-feedback.mjs
});

// After running evaluations, review judgments:
// node evaluation/human-validation/real-human-feedback.mjs
```

**Option B: Custom Validator Function**

```javascript
import { initHumanValidation } from 'ai-visual-test';

// Initialize with custom human validator function
const manager = initHumanValidation({
  enabled: true,
  autoCollect: true,
  smartSampling: true,
  humanValidatorFn: async (vllmJudgment) => {
    // Your custom function to collect human feedback
    // Return null to skip, or return human judgment object
    return {
      score: 8, // Human score (0-10)
      issues: ['contrast issue'], // Human-identified issues
      reasoning: 'Good overall but needs better contrast',
      evaluatorId: 'user-123' // Optional
    };
  }
});
```

**For the best experience, use Option A and review judgments with `real-human-feedback.mjs`** - it opens screenshots and provides a visual interface for review.

### 2. Use Normal Evaluation (Automatic Collection)

**If using Option A (queue for review)**, judgments are automatically saved to disk. After running evaluations, review them with:

```bash
node evaluation/human-validation/real-human-feedback.mjs
```

This opens screenshots and VLLM judgments for you to review interactively.

```javascript
import { validateScreenshot } from 'ai-visual-test';

// Human validation is automatically collected (non-blocking)
const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate this page',
  {
    testType: 'evaluation',
    enableHumanValidation: true // Enabled by default
  }
);

// Calibration is automatically applied if available
console.log(result.score); // May be calibrated
console.log(result.originalScore); // Original VLLM score (if calibrated)
console.log(result.calibrated); // true if calibration was applied
```

### 3. Check Calibration Status

```javascript
import { getHumanValidationManager } from 'ai-visual-test';

const manager = getHumanValidationManager();
const status = manager.getCalibrationStatus();

if (status.calibrated) {
  console.log(`Correlation: ${status.correlation}`);
  console.log(`Kappa: ${status.kappa}`);
  console.log(`MAE: ${status.mae}`);
  console.log(`Status: ${status.isGood ? 'Good' : 'Needs Improvement'}`);
  
  if (status.recommendations) {
    status.recommendations.forEach(rec => console.log(`- ${rec}`));
  }
}
```

## Smart Sampling

The system automatically requests human validation for interesting cases:

1. **Edge cases**: Very high (≥9) or very low (≤3) scores
2. **High uncertainty**: When VLLM uncertainty > 0.3
3. **Many issues**: When 5+ issues detected (might be over-detection)
4. **Low score, no issues**: When score < 6 but no issues (might be under-detection)
5. **Random sampling**: 10% of all cases

You can disable smart sampling to request validation for all cases:

```javascript
const manager = initHumanValidation({
  enabled: true,
  smartSampling: false // Request validation for all cases
});
```

## Automatic Calibration

The system automatically calibrates when enough human judgments are collected:

- **Minimum**: 10 judgments required
- **Auto-recalibration**: Every 20 new judgments
- **Calibration metrics**: Cohen's Kappa, MAE, RMSE, Pearson's r, Spearman's ρ
- **Bias correction**: Automatically adjusts VLLM scores based on human feedback

### Manual Calibration

```javascript
const manager = getHumanValidationManager();
const result = await manager.calibrate();

if (result.success) {
  console.log(`Calibrated with ${result.sampleSize} judgments`);
  console.log(`Correlation: ${result.calibration.agreement.pearson}`);
}
```

## Integration with Existing Systems

### With Batching

```javascript
import { LatencyAwareBatchOptimizer } from 'ai-visual-test';

const optimizer = new LatencyAwareBatchOptimizer({
  maxConcurrency: 5,
  batchSize: 3
});

// Human validation is automatically collected for each result
const result = await optimizer.addRequest(
  'screenshot.png',
  'Evaluate',
  {
    enableHumanValidation: true // Works with batching
  },
  100
);
```

### With Temporal Aggregation

```javascript
import { experiencePageAsPersona, aggregateMultiScale } from 'ai-visual-test';

const experience = await experiencePageAsPersona(page, persona, {
  enableHumanValidation: true // Collected for each evaluation
});

// Human validation is collected for all temporal evaluations
const aggregated = aggregateMultiScale(experience.notes);
```

### With Personas

```javascript
import { evaluateInteractiveWebsite } from '../evaluation/utils/evaluate-interactive-experiences.mjs';

// Human validation is automatically collected for each persona evaluation
const results = await evaluateInteractiveWebsite(website, {
  enableHumanValidation: true
});
```

## Custom Human Validator

You can implement your own human validator function:

```javascript
const manager = initHumanValidation({
  enabled: true,
  humanValidatorFn: async (vllmJudgment) => {
    // Show screenshot in UI
    const screenshot = await loadImage(vllmJudgment.screenshot);
    displayScreenshot(screenshot);
    
    // Show VLLM judgment
    displayVLLMJudgment(vllmJudgment);
    
    // Collect human input (your UI implementation)
    const humanScore = await promptForScore();
    const humanIssues = await promptForIssues();
    const humanReasoning = await promptForReasoning();
    
    // Return human judgment
    return {
      score: humanScore,
      issues: humanIssues,
      reasoning: humanReasoning,
      evaluatorId: getCurrentUserId()
    };
  }
});
```

## Disabling Human Validation

Human validation is **opt-in** and can be disabled:

```javascript
// Disable for specific evaluation
const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate',
  {
    enableHumanValidation: false // Disable for this evaluation
  }
);

// Or disable globally
const manager = getHumanValidationManager();
manager.enabled = false;
```

## Files and Storage

- **VLLM judgments**: `evaluation/human-validation/vllm-judgments-*.json`
- **Human judgments**: `evaluation/human-validation/human-*.json`
- **Calibration cache**: `evaluation/human-validation/calibration-cache.json`
- **Calibration reports**: `evaluation/human-validation/calibration-*.md`

## API Reference

### `HumanValidationManager`

```javascript
class HumanValidationManager {
  constructor(options)
  collectVLLMJudgment(vllmResult, imagePath, prompt, context)
  getCalibrationStatus()
  applyCalibration(vllmScore)
  calibrate()
}
```

### `initHumanValidation(options)`

Initialize and enable human validation.

### `getHumanValidationManager()`

Get the global human validation manager instance.

## Example: Complete Workflow

```javascript
import { 
  initHumanValidation, 
  validateScreenshot,
  getHumanValidationManager 
} from 'ai-visual-test';

// 1. Initialize human validation
const manager = initHumanValidation({
  enabled: true,
  autoCollect: true,
  smartSampling: true,
  humanValidatorFn: async (vllmJudgment) => {
    // Your custom validation UI
    return await collectHumanFeedback(vllmJudgment);
  }
});

// 2. Run evaluations (human validation collected automatically)
for (const screenshot of screenshots) {
  const result = await validateScreenshot(
    screenshot,
    'Evaluate this page',
    { enableHumanValidation: true }
  );
  
  // Result may be calibrated
  console.log(`Score: ${result.score}${result.calibrated ? ' (calibrated)' : ''}`);
}

// 3. Check calibration status
const status = manager.getCalibrationStatus();
if (status.calibrated) {
  console.log(`Calibration: ${status.isGood ? 'Good' : 'Needs Improvement'}`);
  console.log(`Correlation: ${status.correlation.toFixed(3)}`);
}

// 4. Manually trigger calibration if needed
await manager.calibrate();
```

## Benefits

1. **Zero overhead**: Non-blocking, doesn't slow down evaluations
2. **Automatic learning**: Calibrates based on human feedback
3. **Smart sampling**: Focuses on interesting cases
4. **Seamless integration**: Works with all existing systems
5. **Optional**: Can be enabled/disabled per evaluation

## Next Steps

1. Implement your custom `humanValidatorFn` to collect human feedback
2. Run evaluations with `enableHumanValidation: true`
3. Check calibration status periodically
4. Use calibrated scores for better accuracy

