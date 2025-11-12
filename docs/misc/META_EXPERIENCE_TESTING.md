# Meta Experience Testing: Using ai-visual-test on Itself

## Overview

The documentation site uses **all of ai-visual-test's capabilities** to test and validate itself. This is the ultimate "drink champagne / dog food" approach - comprehensively using our own tool on our own documentation.

## Comprehensive Meta Test

Run the comprehensive meta experience test:

```bash
node evaluation/meta-comprehensive-experience.mjs
```

This test uses **all available APIs**:

### 1. Basic Validation
- `validateScreenshot()` - Core validation with uncertainty reduction

### 2. Persona-Based Evaluation
- `experiencePageAsPersona()` - Tests from multiple user perspectives:
  - New Developer
  - Experienced Developer
  - Accessibility Advocate

### 3. Multi-Modal Validation
- `extractRenderedCode()` - Captures HTML/CSS
- `validateScreenshot()` with rendered code context
- `checkCrossModalConsistency()` - Validates screenshot vs code consistency

### 4. Temporal Aggregation
- `captureTemporalScreenshots()` - Captures temporal sequence
- `aggregateTemporalNotes()` - Standard temporal aggregation
- `aggregateMultiScale()` - Multi-scale temporal aggregation

### 5. Goals-Based Validation
- `validateWithGoals()` - Tests with variable goals:
  - String goals
  - Goal objects
  - Multiple goals

### 6. Browser Experience Testing
- `testBrowserExperience()` - Full browser experience across stages:
  - Initial load
  - Scroll
  - Navigation
  - Interaction

### 7. Ensemble Judging
- `EnsembleJudge` - Multi-provider ensemble (if multiple providers configured)

## What This Demonstrates

1. **All APIs Work** - Every capability is tested
2. **Self-Validation** - The tool validates its own documentation
3. **Comprehensive Coverage** - All techniques are demonstrated
4. **Real-World Usage** - Shows how to use all features together

## Results

Results are saved to:
- `evaluation/results/meta-comprehensive/comprehensive-meta-{timestamp}.json`
- `evaluation/results/meta-comprehensive/comprehensive-meta-report-{timestamp}.html`

The HTML report shows:
- Scores from all tests
- Issues found
- Techniques used
- Persona perspectives
- Temporal analysis
- Cross-modal consistency

## Meta-Testing Philosophy

This approach:
- ✅ Validates the tool works end-to-end
- ✅ Demonstrates all capabilities
- ✅ Provides real-world examples
- ✅ Tests the tool on actual content
- ✅ Shows confidence in the tool

## Integration

The documentation site (`docs-site/index.html`) includes a meta-test section that:
- Links to the comprehensive test
- Shows which APIs are used
- Demonstrates the "drink champagne / dog food" approach

