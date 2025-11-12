# Human Feedback Collection: Where Are The Humans?

## The Gap

The human validation system **requests** human validation but doesn't actually **collect** it from humans. The `humanValidatorFn` is just a placeholder.

## Solutions

### 1. CLI Interface (Implemented) ✅

**File**: `evaluation/human-feedback-ui.mjs`

**Usage**:
```bash
node evaluation/human-feedback-ui.mjs
```

**What it does**:
- Shows pending VLLM judgments
- Displays screenshot path and VLLM judgment
- Collects human score, issues, and reasoning interactively
- Saves human judgments for calibration

**Example**:
```
👤 Human Validation Request
🤖 VLLM Score: 8/10
🤖 VLLM Issues: contrast issue
📸 Screenshot: /path/to/screenshot.png

📝 Please provide your judgment:
   Score (0-10): 7
   Issues: contrast issue, spacing
   Reasoning: Good overall but needs better contrast
```

### 2. Web UI (Template) ⚠️

**File**: `evaluation/human-feedback-web-ui.html`

**Status**: Template created, needs backend integration

**What it needs**:
- API endpoint to load pending judgments
- API endpoint to save human judgments
- Screenshot display (base64 or file serving)
- Real-time updates

### 3. Integration Options

#### Option A: Simple File-Based Workflow

1. System collects VLLM judgments → saves to JSON files
2. Human reviews JSON files → adds human judgments
3. System loads human judgments → calibrates

**Pros**: Simple, no infrastructure needed
**Cons**: Manual, not real-time

#### Option B: API-Based Workflow

1. System collects VLLM judgments → sends to API
2. Web UI loads from API → displays to humans
3. Humans provide feedback → saves to API
4. System loads from API → calibrates

**Pros**: Real-time, scalable, better UX
**Cons**: Requires API infrastructure

#### Option C: Queue-Based Workflow

1. System collects VLLM judgments → adds to queue
2. Human workers pull from queue → review
3. Human judgments saved → calibration triggered

**Pros**: Scalable, can handle many workers
**Cons**: More complex infrastructure

## Current Implementation

### What Works ✅

1. **VLLM Judgment Collection**: Automatic, working
2. **Smart Sampling**: Requests human validation for interesting cases
3. **Storage**: VLLM judgments saved to files
4. **Calibration Framework**: Ready when human judgments available

### What's Missing ⚠️

1. **Human Input Mechanism**: No actual way for humans to provide feedback
2. **UI/Interface**: CLI exists but needs to be run manually
3. **Workflow**: No automated process for human review
4. **Integration**: Not integrated into Queeraoke workflow

## Recommended Approach

### Phase 1: CLI Tool (Now) ✅

Use the CLI tool for initial human feedback collection:

```bash
# After running tests with human validation
node evaluation/human-feedback-ui.mjs
```

### Phase 2: Web UI (Next)

Build a simple web UI that:
- Serves pending judgments
- Displays screenshots
- Collects human feedback
- Saves judgments

### Phase 3: Integration (Future)

Integrate into Queeraoke workflow:
- Automatic notification when validations needed
- Dashboard showing calibration status
- Batch review interface

## Quick Start: Collect Human Feedback Now

### Step 1: Run Tests with Human Validation

```javascript
import { initHumanValidation } from 'ai-visual-test';

initHumanValidation({
  enabled: true,
  autoCollect: true
});

// Run your tests...
```

### Step 2: Collect Human Feedback

```bash
node evaluation/human-feedback-ui.mjs
```

### Step 3: Calibrate

The system will automatically calibrate after 10+ human judgments, or manually:

```javascript
const manager = getHumanValidationManager();
await manager.calibrate();
```

## The Human Validator Function

Currently, the `humanValidatorFn` is just a placeholder. To actually collect human feedback, you need to:

1. **Implement your own validator**:
```javascript
initHumanValidation({
  humanValidatorFn: async (vllmJudgment) => {
    // Your UI to collect human feedback
    // Could be:
    // - CLI prompt
    // - Web UI
    // - API call
    // - File-based workflow
    
    return {
      score: humanScore,
      issues: humanIssues,
      reasoning: humanReasoning
    };
  }
});
```

2. **Or use the CLI tool**:
```bash
# Run this after tests
node evaluation/human-feedback-ui.mjs
```

## Next Steps

1. **Use CLI tool** for immediate human feedback collection
2. **Build web UI** for better UX (optional)
3. **Integrate into workflow** for automated collection (future)

The infrastructure is ready - we just need humans to provide feedback! 👤

