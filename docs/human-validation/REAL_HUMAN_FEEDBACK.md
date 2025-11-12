# Real Human Feedback Collection

## Overview

The **real human feedback system** makes it practical for humans (you!) to provide feedback on VLLM judgments. It opens screenshots and displays VLLM judgments in a visual interface, making it easy to review and provide your own assessment.

## Features

- **Opens screenshots automatically** in your default image viewer
- **Creates HTML viewer** with screenshot + VLLM judgment side-by-side
- **Interactive CLI** for collecting your feedback
- **Automatic calibration** after collecting feedback
- **Works on macOS, Linux, and Windows**

## Quick Start

### 1. Run Evaluations with Human Validation Enabled

```javascript
import { initHumanValidation, validateScreenshot } from 'ai-visual-test';

// Initialize human validation (no validator function needed - it queues for review)
initHumanValidation({
  enabled: true,
  autoCollect: true,
  smartSampling: true
  // No humanValidatorFn - judgments will be queued for review
});

// Run your evaluations
const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate this page',
  { enableHumanValidation: true }
);
```

### 2. Review Queued Judgments

After running evaluations, judgments are queued for review. Run:

```bash
node evaluation/human-validation/real-human-feedback.mjs
```

This will:
1. Show pending VLLM judgments
2. Open each screenshot in your default viewer
3. Open an HTML viewer with screenshot + VLLM judgment
4. Prompt you for your score, issues, and reasoning
5. Save your judgment for calibration

### 3. Calibration

After providing feedback, the system automatically calibrates:

```bash
# Calibration happens automatically after collecting feedback
# Or run manually:
node evaluation/human-validation/real-human-feedback.mjs
# Then select "skip" to go directly to calibration
```

## How It Works

### Workflow

1. **Collection Phase**: VLLM judgments are collected automatically during evaluations
2. **Queue Phase**: Judgments are saved to disk and queued for human review
3. **Review Phase**: You run `real-human-feedback.mjs` to review judgments
4. **Calibration Phase**: System calibrates VLLM scores based on your feedback

### Smart Sampling

The system uses smart sampling to request human validation for:
- Edge cases (very high/low scores)
- High uncertainty
- Many issues detected
- Low score with no issues
- Random sampling (10% of cases)

### HTML Viewer

The HTML viewer shows:
- **Left side**: Screenshot (full size, easy to inspect)
- **Right side**: VLLM judgment (score, issues, reasoning)
- **Dark theme**: Easy on the eyes for extended review

### Calibration

After collecting human judgments, the system:
- Calculates correlation (Pearson, Spearman)
- Calculates agreement (Cohen's Kappa)
- Calculates bias (MAE, score bias)
- Applies calibration adjustments to future VLLM scores

## Example Session

```bash
$ node evaluation/human-validation/real-human-feedback.mjs

👤 Real Human Feedback Collection

======================================================================
This tool opens screenshots and VLLM judgments for you to review.
Your feedback will be used to calibrate the VLLM system.

📊 Found 3 pending VLLM judgments

You can:
  - Review all pending judgments
  - Review specific judgment by number
  - Skip to calibration

Review mode (all/specific/skip): all

📋 Reviewing all 3 pending judgments

[1/3] Reviewing judgment: vllm-1234567890-abc...
Review this judgment? (y/n/q to quit): y

======================================================================
👤 Human Validation Request
======================================================================

📄 Opening HTML viewer with screenshot and VLLM judgment...
📸 Opening screenshot in default viewer...

⏳ Take a moment to review the screenshot and VLLM judgment...

🤖 VLLM Judgment Summary:
   Score: 8/10
   Issues: contrast issue
   Reasoning: Good overall design but needs better contrast...
   Test: evaluation

📝 Please provide your judgment:

   Your Score (0-10): 7

   Issues you found (comma-separated, or press Enter for none):
   contrast issue, spacing

   Your reasoning (optional, press Enter to skip):
   Good design but contrast could be better, and spacing is tight

   Your ID (optional, for tracking): reviewer-1

✅ Human judgment saved!
   Your score: 7/10
   VLLM score: 8/10
   Difference: 1 point
```

## Integration

### With Queeraoke

```javascript
// In queeraoke test file
import { initHumanValidation } from 'ai-visual-test';

// Initialize once
initHumanValidation({
  enabled: true,
  autoCollect: true,
  smartSampling: true
});

// Then run tests normally - judgments are queued automatically
// After tests, run: node evaluation/human-validation/real-human-feedback.mjs
```

### Custom Validator Function

If you want to provide feedback programmatically:

```javascript
initHumanValidation({
  enabled: true,
  autoCollect: true,
  smartSampling: true,
  humanValidatorFn: async (vllmJudgment) => {
    // Your custom logic to collect human feedback
    // Return null to skip, or return:
    return {
      score: 8,
      issues: ['contrast issue'],
      reasoning: 'Good overall',
      evaluatorId: 'custom-validator'
    };
  }
});
```

## Tips

1. **Review in batches**: Review multiple judgments at once for efficiency
2. **Be consistent**: Use consistent scoring criteria across reviews
3. **Provide reasoning**: Detailed reasoning helps improve calibration
4. **Review edge cases**: Focus on judgments where VLLM score is very high/low
5. **Calibrate regularly**: Run calibration after collecting 10+ judgments

## Troubleshooting

### Screenshots don't open

- **macOS**: Uses `open` command (should work by default)
- **Linux**: Requires `xdg-open` (usually pre-installed)
- **Windows**: Uses `start` command (should work by default)

If automatic opening fails, the tool will show the file path - open it manually.

### HTML viewer doesn't open

Same as above - check your system's default browser. The HTML file is saved to `evaluation/validation-viewer.html` and can be opened manually.

### No pending judgments

Make sure you've run evaluations with `enableHumanValidation: true` in the context. Judgments are saved automatically during evaluation.

## Next Steps

- **Batch review**: Review multiple judgments efficiently
- **Calibration**: System learns from your feedback
- **Improvement**: VLLM scores become more aligned with human judgment

