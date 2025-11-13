# ai-visual-test

Validate screenshots with AI instead of pixel-diffing. Understands what your UI actually means, not just whether pixels changed.

[![GitHub](https://img.shields.io/github/license/arclabs561/ai-visual-test)](https://github.com/arclabs561/ai-visual-test)
[![Node.js](https://img.shields.io/node/v/ai-visual-test)](https://nodejs.org/)

## Why this exists

Pixel-based visual testing breaks when content changes, timezones shift, or layouts adjust slightly. This tool uses vision language models to understand what your screenshots actually mean.

Instead of asking "did pixels change?", it asks "does this payment screen look correct?" The AI understands context, accessibility, and design principles.

## Quick example

```javascript
import { validateScreenshot } from 'ai-visual-test';

const result = await validateScreenshot(
  'payment-screen.png',
  'Check if this payment form is accessible and usable'
);

console.log(result.score); // 0-10
console.log(result.issues); // ['Missing error messages', 'Low contrast on submit button']
```

## Installation

```bash
npm install ai-visual-test
```

Set `GEMINI_API_KEY` or `OPENAI_API_KEY` in your environment. Works with Gemini (cheapest), OpenAI, or Claude. Auto-picks the cheapest available provider.

## What it's good for

- **Semantic validation** - Understands UI meaning, not just pixels (VLLM-based)
- **Dynamic content** - Handles feeds, timestamps, user data gracefully
- **Accessibility checks** - AI can spot contrast issues, missing labels (VLLM) or fast programmatic checks
- **Design principles** - Validates brutalist, minimal, or other design styles
- **Temporal testing** - Analyzes animations and gameplay over time
- **State validation** - Validates game state, UI state, form state matches visual representation (VLLM or programmatic)
- **Rubric-based evaluation** - Uses explicit rubrics for consistent, reliable scoring
- **Fast programmatic checks** - Deterministic contrast, state, and position validation (<100ms, no API calls)

## What it's not good for

- **Pixel-perfect brand consistency** - Use Percy/Chromatic for that
- **Very fast feedback loops** - AI calls take 1-3 seconds
- **Offline testing** - Requires API access

## Basic usage

```javascript
import { validateScreenshot } from 'ai-visual-test';

const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate this payment screen for usability and accessibility',
  {
    testType: 'payment-screen',
    viewport: { width: 1280, height: 720 }
  }
);

if (result.score < 7) {
  console.warn('Issues found:', result.issues);
}
```

## With Playwright

```javascript
import { test } from '@playwright/test';
import { validateScreenshot } from 'ai-visual-test';

test('payment screen is accessible', async ({ page }) => {
  await page.goto('/checkout');
  await page.screenshot({ path: 'checkout.png' });
  
  const result = await validateScreenshot(
    'checkout.png',
    'Check accessibility: keyboard navigation, contrast, labels'
  );
  
  expect(result.score).toBeGreaterThan(7);
});
```

## Validators

Generic validators for common testing patterns:

### State Validator

Validate that visual state matches expected state (game state, UI state, form state):

```javascript
import { StateValidator } from 'ai-visual-test';

const validator = new StateValidator({ tolerance: 5 });
const result = await validator.validateState(
  'screenshot.png',
  { ball: { x: 100, y: 200 }, paddle: { x: 150 } }
);

if (!result.matches) {
  console.log('State mismatches:', result.validation.discrepancies);
}
```

### Accessibility Validator

Configurable accessibility validation with WCAG standards:

```javascript
import { AccessibilityValidator } from 'ai-visual-test';

const a11y = new AccessibilityValidator({
  minContrast: 4.5, // WCAG-AA
  standards: ['WCAG-AA'],
  zeroTolerance: false
});

const result = await a11y.validateAccessibility('screenshot.png');
if (!result.passes) {
  console.log('Violations:', result.violations);
}
```

### Prompt Builder

Template-based prompt construction with rubric integration:

```javascript
import { PromptBuilder } from 'ai-visual-test';

const builder = new PromptBuilder({
  templates: {
    accessibility: (vars) => `Check ${vars.element} for ${vars.standard} compliance`
  }
});

const prompt = builder.buildFromTemplate('accessibility', {
  element: 'buttons',
  standard: 'WCAG-AA'
});
```

### Rubric Validation

Validate with explicit rubrics for consistent scoring:

```javascript
import { validateWithRubric } from 'ai-visual-test';

const rubric = {
  score: {
    criteria: {
      10: 'Perfect',
      8: 'Good',
      5: 'Acceptable'
    }
  },
  criteria: [
    { id: 'ZT-1', rule: 'Contrast <4.5:1 = FAIL', zeroTolerance: true }
  ]
};

const result = await validateWithRubric('screenshot.png', 'Check accessibility', rubric);
```

### Batch Validator

Batch validation with cost tracking and statistics:

```javascript
import { BatchValidator } from 'ai-visual-test';

const validator = new BatchValidator({
  trackCosts: true,
  trackStats: true
});

const { results, stats } = await validator.batchValidate(
  ['screenshot1.png', 'screenshot2.png'],
  'Evaluate UI quality'
);

console.log('Cost:', stats.costStats);
console.log('Performance:', stats.performance);
```

## Programmatic Validators

Fast, deterministic validators for when you have Playwright page access. Use these for fast feedback (<100ms) instead of VLLM when possible.

### Accessibility (Programmatic)

Fast contrast and keyboard navigation checks:

```javascript
import { checkElementContrast, checkAllTextContrast, checkKeyboardNavigation } from 'ai-visual-test';

// Check single element contrast
const result = await checkElementContrast(page, '#my-button', 4.5);
if (!result.passes) {
  console.log(`Contrast ratio: ${result.ratio}:1 (required: 4.5:1)`);
}

// Check all text elements
const allText = await checkAllTextContrast(page, 21.0); // Brutalist 21:1 requirement
console.log(`${allText.failing} elements fail contrast`);

// Check keyboard navigation
const keyboard = await checkKeyboardNavigation(page);
console.log(`${keyboard.focusableElements} focusable elements`);
```

### State Validation (Programmatic)

Fast state validation using direct state access:

```javascript
import { validateStateProgrammatic, validateElementPosition } from 'ai-visual-test';

// Validate game state matches visual representation
const result = await validateStateProgrammatic(page, {
  ball: { x: 100, y: 200 },
  paddle: { x: 150 }
}, {
  selectors: {
    ball: '#game-ball',
    paddle: '#game-paddle'
  },
  tolerance: 5
});

if (!result.matches) {
  console.log('Discrepancies:', result.discrepancies);
}

// Validate element position
const position = await validateElementPosition(
  page,
  '#my-element',
  { x: 100, y: 200 },
  5 // tolerance
);
```

**When to use programmatic vs VLLM validators:**

- **Programmatic**: Fast (<100ms), deterministic, works offline, use when you have page access
- **VLLM-based**: Semantic understanding, works with screenshots only, use for design principles, context-aware checks
- **Hybrid**: Best of both - programmatic data provides ground truth, VLLM evaluates semantically

### Hybrid Validators

Combine programmatic validation with VLLM evaluation for the best results:

```javascript
import { validateAccessibilityHybrid, validateStateHybrid } from 'ai-visual-test';

// Hybrid accessibility: programmatic contrast + VLLM semantic evaluation
const a11yResult = await validateAccessibilityHybrid(
  page,
  'screenshot.png',
  21.0, // minContrast
  { testType: 'accessibility' }
);
// Result includes both programmatic data and VLLM evaluation

// Hybrid state: programmatic state + VLLM visual consistency
const stateResult = await validateStateHybrid(
  page,
  'screenshot.png',
  { ball: { x: 100, y: 200 } },
  {
    selectors: { ball: '#game-ball' },
    tolerance: 5
  }
);
// Result includes both programmatic state and VLLM evaluation
```

**Why hybrid?**
- Programmatic data provides **ground truth** (avoids hallucinations)
- VLLM provides **semantic reasoning** (context, criticality, usability)
- Combined: More reliable than pure VLLM, more nuanced than pure programmatic
```

## Persona-based testing

Test from different user perspectives:

```javascript
import { experiencePageAsPersona } from 'ai-visual-test';

const experience = await experiencePageAsPersona(page, {
  name: 'Accessibility Advocate',
  goals: ['Check keyboard navigation', 'Verify screen reader compatibility'],
  device: 'desktop'
});

console.log(`Experience score: ${experience.score}`);
```

## Cost management

- Results cached by default (7 day TTL)
- Each result includes cost estimate
- Auto-selects cheapest provider (Gemini → OpenAI → Claude)
- Run `npm publish --dry-run` to see what gets published

## API

### `validateScreenshot(imagePath, prompt, context)`

Validates a screenshot using vision language models.

**Parameters:**
- `imagePath` (string): Path to screenshot file
- `prompt` (string): What to evaluate (e.g., "Check accessibility")
- `context` (object, optional):
  - `testType` (string): Type of test
  - `viewport` (object): Viewport size
  - `useCache` (boolean): Enable caching (default: true)

**Returns:**
- `score` (number|null): 0-10 score
- `issues` (array): List of issues found
- `reasoning` (string): Why this score
- `provider` (string): Which AI provider was used
- `estimatedCost` (object): Cost estimate

See [docs/api/API_ESSENTIALS.md](docs/api/API_ESSENTIALS.md) for API essentials and [docs/api/API_REVIEW_AND_ALIGNMENT.md](docs/api/API_REVIEW_AND_ALIGNMENT.md) for detailed API reference.

## Configuration

Set environment variables:

```bash
# At least one API key required
GEMINI_API_KEY=your-key-here
# OR
OPENAI_API_KEY=your-key-here
# OR
ANTHROPIC_API_KEY=your-key-here

# Optional: force provider
VLM_PROVIDER=gemini  # or 'openai', 'claude'
```

## Examples

- [Basic validation](example.test.mjs)
- [Playwright integration](test/integration-v0.3-features.test.mjs)
- [Persona testing](test/persona-experience.test.mjs)
- [Temporal analysis](test/temporal-evaluation.test.mjs)

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[Documentation Index](./docs/README.md)** - Complete guide to all documentation with summaries and connections
- **[API Essentials](./docs/api/API_ESSENTIALS.md)** - Quick start and API essentials
- **[Research Integration](./docs/research/RESEARCH_INTEGRATION.md)** - Research papers and implementation status
- **[Standalone Usage](./docs/STANDALONE_USAGE.md)** - How to use the library
- **[Human Validation](./docs/HUMAN_VALIDATION_INTEGRATION.md)** - Human feedback and calibration system

See [docs/README.md](./docs/README.md) for the complete documentation index.

## Research

This package implements research-backed practices:

- **Explicit rubrics** - Research suggests explicit rubrics improve reliability (implementation integrated, validation pending)
- **Bias detection** - Detects position bias, verbosity bias
- **Ensemble judging** - Multiple providers for consensus
- **Temporal aggregation** - Coherence checking over time

Note: Some research citations are conceptual inspirations rather than exact implementations. See [docs/research/RESEARCH_INTEGRATION.md](docs/research/RESEARCH_INTEGRATION.md) for detailed implementation status and [docs/research/RESEARCH_UPDATE_2025.md](docs/research/RESEARCH_UPDATE_2025.md) for research papers and citations.

## Comparison

**vs Pixel-based tools (Percy, Chromatic):**
- ✅ Understands meaning, not just pixels
- ✅ Handles dynamic content gracefully
- ❌ Not pixel-perfect (use Percy for that)

**vs Traditional testing:**
- ✅ Validates accessibility automatically
- ✅ Understands design principles
- ✅ Provides human-readable feedback

See [docs/RESEARCH_INTEGRATION.md](docs/RESEARCH_INTEGRATION.md) for research comparison and integration details.

## Dependencies

- `@playwright/test` (optional) - For Playwright integration
- `@arclabs561/llm-utils` (optional) - For advanced data extraction

Pure ES Modules, no build step required.

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
