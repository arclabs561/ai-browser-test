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

- **Semantic validation** - Understands UI meaning, not just pixels
- **Dynamic content** - Handles feeds, timestamps, user data gracefully
- **Accessibility checks** - AI can spot contrast issues, missing labels
- **Design principles** - Validates brutalist, minimal, or other design styles
- **Temporal testing** - Analyzes animations and gameplay over time

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

See [docs/API_ESSENTIALS.md](docs/API_ESSENTIALS.md) for API essentials and [docs/API_REVIEW_AND_ALIGNMENT.md](docs/API_REVIEW_AND_ALIGNMENT.md) for detailed API reference.

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
- **[API Essentials](./docs/API_ESSENTIALS.md)** - Quick start and API essentials
- **[Research Integration](./docs/RESEARCH_INTEGRATION.md)** - Research papers and implementation status
- **[Standalone Usage](./docs/STANDALONE_USAGE.md)** - How to use the library
- **[Human Validation](./docs/HUMAN_VALIDATION_INTEGRATION.md)** - Human feedback and calibration system

See [docs/README.md](./docs/README.md) for the complete documentation index.

## Research

This package implements research-backed practices:

- **Explicit rubrics** - Research suggests explicit rubrics improve reliability (implementation integrated, validation pending)
- **Bias detection** - Detects position bias, verbosity bias
- **Ensemble judging** - Multiple providers for consensus
- **Temporal aggregation** - Coherence checking over time

See [docs/RESEARCH_UPDATE_2025.md](docs/RESEARCH_UPDATE_2025.md) for research papers and citations.

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
