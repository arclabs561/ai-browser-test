# ai-browser-test

Browser testing utilities using Vision Language Models (VLLM) for multi-modal validation with Playwright.

[![GitHub](https://img.shields.io/github/license/arclabs561/ai-browser-test)](https://github.com/arclabs561/ai-browser-test)
[![Node.js](https://img.shields.io/node/v/ai-browser-test)](https://nodejs.org/)

**A standalone, general-purpose package for browser testing with AI-powered multi-modal validation.**

Supports:
- **Browser/Playwright Integration** - Viewport management, device emulation, page interaction
- **Multi-Modal Validation** - Screenshot + HTML + CSS + rendered code + DOM structure
- **Persona-Based Experience Testing** - Test page experience from different persona perspectives with human-interpreted time scales
- **Built-in Prompts** - Pluggable prompt templates (brutalist, Josh Comeau, etc.)
- **Context/Hooks/Encoding** - Context compression, state history, temporal aggregation
- **Temporal/Gameplay** - Screenshot capture over time, gameplay testing

## Overview

VLLM Testing provides a comprehensive solution for visual regression testing using Vision Language Models (VLLM). It was initially motivated by the need for semantic screenshot validation in web applications, but is designed as a general-purpose tool for any project requiring AI-powered visual testing.

### Features

- **Multi-Provider Support**: Works with Gemini, OpenAI, and Claude
- **Cost-Effective**: Auto-selects cheapest provider, includes caching
- **Multi-Modal Validation**: Screenshots + rendered code + context
- **Temporal Analysis**: Time-series validation for animations
- **Multi-Perspective**: Multiple personas evaluate same state
- **Serverless API**: Deploy as Vercel function for remote validation
- **Zero Dependencies**: Pure ES Modules, no build step

## Installation

```bash
# From npm (recommended)
npm install ai-browser-test

# Or from GitHub
npm install git+https://github.com/arclabs561/ai-browser-test.git

# For local development (using npm link)
cd /path/to/ai-browser-test
npm link
cd /path/to/your-project
npm link ai-browser-test
```

### Environment Setup

Create a `.env` file (see `.env.example` for template):

```bash
# Required: At least one API key
GEMINI_API_KEY=your-key-here
# OR
OPENAI_API_KEY=your-key-here
# OR
ANTHROPIC_API_KEY=your-key-here

# Optional: Explicit provider selection
VLM_PROVIDER=gemini  # or 'openai', 'claude'
```

## Quick Start

### As a Library

```javascript
import { validateScreenshot, createConfig } from 'ai-browser-test';

// Configure (optional - auto-detects from env vars)
const config = createConfig({
  provider: 'gemini', // or 'openai', 'claude'
  apiKey: process.env.GEMINI_API_KEY,
  cacheEnabled: true
});

// Validate screenshot
const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate this screenshot for quality and correctness.',
  {
    testType: 'payment-screen',
    viewport: { width: 1280, height: 720 }
  }
);

console.log('Score:', result.score);
console.log('Issues:', result.issues);
```

### As a Vercel API

Deploy to Vercel to get a serverless validation API:

```bash
vercel
```

Then use the API:

```javascript
const response = await fetch('https://your-site.vercel.app/api/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: base64Image,
    prompt: 'Evaluate this screenshot...',
    context: { testType: 'payment-screen' }
  })
});

const result = await response.json();
```

## API

### Core Functions

#### `validateScreenshot(imagePath, prompt, context)`

Validates a screenshot using VLLM.

**Parameters:**
- `imagePath` (string): Path to screenshot file
- `prompt` (string): Evaluation prompt
- `context` (object): Context object with:
  - `testType` (string): Type of test
  - `viewport` (object): Viewport size
  - `gameState` (object): Game state (optional)
  - `useCache` (boolean): Enable/disable caching (default: true)
  - `timeout` (number): Request timeout in ms (default: 30000)

**Returns:**
- `Promise<Object>`: Validation result with:
  - `enabled` (boolean): Whether VLLM is enabled
  - `provider` (string): Provider used
  - `score` (number|null): Score from 0-10
  - `issues` (array): List of issues found
  - `assessment` (string|null): Overall assessment
  - `reasoning` (string): Reasoning for score
  - `estimatedCost` (object|null): Cost estimate
  - `responseTime` (number): Response time in ms

#### `createConfig(options)`

Creates configuration for VLLM judge.

**Parameters:**
- `options` (object):
  - `provider` (string): Provider name ('gemini', 'openai', 'claude')
  - `apiKey` (string): API key
  - `env` (object): Environment variables (default: process.env)
  - `cacheDir` (string): Cache directory path
  - `cacheEnabled` (boolean): Enable caching (default: true)
  - `maxConcurrency` (number): Max concurrent requests (default: 5)
  - `timeout` (number): Request timeout (default: 30000)
  - `verbose` (boolean): Verbose logging (default: false)

**Returns:**
- `Object`: Configuration object

### Multi-Modal Validation

#### `extractRenderedCode(page)`

Extracts rendered HTML/CSS from Playwright page.

#### `captureTemporalScreenshots(page, fps, duration)`

Captures temporal screenshots for animation validation.

#### `multiPerspectiveEvaluation(validateFn, screenshotPath, renderedCode, gameState, personas)`

Evaluates screenshot from multiple perspectives.

### Evaluation Rubrics

#### `buildRubricPrompt(rubric, includeDimensions)`

Builds explicit evaluation rubric prompt. Research shows explicit rubrics improve reliability by 10-20%.

#### `getRubricForTestType(testType)`

Gets test-type-specific rubric (e.g., 'payment-screen', 'gameplay', 'form').

**Example:**
```javascript
import { buildRubricPrompt, getRubricForTestType } from 'ai-browser-test';

const rubric = getRubricForTestType('payment-screen');
const rubricPrompt = buildRubricPrompt(rubric);
```

### Bias Detection

#### `detectBias(judgment, options)`

Detects biases in LLM judgments (verbosity, length, formatting, authority).

#### `detectPositionBias(judgments)`

Detects position bias across multiple judgments.

**Example:**
```javascript
import { detectBias } from 'ai-browser-test';

const result = await validateScreenshot('screenshot.png', 'Evaluate');
const bias = detectBias(result.reasoning);

if (bias.hasBias) {
  console.log('Bias detected:', bias.biases);
  console.log('Recommendations:', bias.recommendations);
}
```

### Ensemble Judging

#### `EnsembleJudge`

Manages multiple LLM judges with consensus voting. Improves accuracy and reduces bias.

#### `createEnsembleJudge(providers, options)`

Creates ensemble judge with multiple providers.

**Example:**
```javascript
import { createEnsembleJudge } from 'ai-browser-test';

const ensemble = createEnsembleJudge(['gemini', 'openai'], {
  votingMethod: 'weighted_average',
  enableBiasDetection: true
});

const result = await ensemble.evaluate('screenshot.png', 'Evaluate this');
console.log('Ensemble score:', result.score);
console.log('Agreement:', result.agreement.score);
```

### Temporal Decision-Making

#### `humanPerceptionTime(action, context)`

✅ **CLEARLY USEFUL** - Models human perception at different time scales. Actually used in persona-based testing.

```javascript
import { humanPerceptionTime } from 'ai-browser-test';

const time = humanPerceptionTime('reading', {
  contentLength: 1000,
  attentionLevel: 'normal', // 'focused', 'normal', 'distracted'
  actionComplexity: 'normal', // 'simple', 'normal', 'complex'
  persona: { name: 'Power User' }
});
// Returns: time in milliseconds based on research-aligned perception models
```

**Use Cases:**
- Persona-based testing (realistic timing)
- Simulating user behavior
- Content-aware interaction timing

#### `SequentialDecisionContext`

⚠️ **PARTIALLY USEFUL** - Maintains context across LLM calls for better sequential decision-making.

```javascript
import { SequentialDecisionContext } from 'ai-browser-test';

const context = new SequentialDecisionContext({ maxHistory: 10 });
context.addDecision({ score: 8, issues: ['contrast'] });
const adaptedPrompt = context.adaptPrompt(basePrompt, {});
```

**Note:** Data shows it can increase variance if over-applied. Use adaptive confidence thresholds.

#### `aggregateMultiScale(notes, options)`

❓ **QUESTIONABLE UTILITY** - Aggregates temporal notes at multiple time scales. No clear use case demonstrated.

```javascript
import { aggregateMultiScale } from 'ai-browser-test';

const aggregated = aggregateMultiScale(notes, {
  timeScales: {
    immediate: 100,   // 0.1s
    short: 1000,     // 1s
    medium: 10000,   // 10s
    long: 60000      // 60s
  }
});
```

**Note:** Consider if you actually need multi-scale analysis before using.

### Temporal Aggregation

#### `aggregateTemporalNotes(notes, options)`

Aggregates notes temporally with coherence checking.

#### `formatNotesForPrompt(aggregated)`

Formats aggregated notes for VLLM prompt.

### Cache

#### `getCached(imagePath, prompt, context)`

Get cached result.

#### `setCached(imagePath, prompt, context, result)`

Set cached result.

#### `clearCache()`

Clear cache.

#### `getCacheStats()`

Get cache statistics.

### Logger

#### `enableDebug()`

Enable debug logging (warnings and info messages will be shown).

#### `disableDebug()`

Disable debug logging (default - silent mode).

#### `isDebugEnabled()`

Check if debug logging is enabled.

#### `warn(...args)`

Log a warning (only if debug enabled).

#### `log(...args)`

Log info (only if debug enabled).

#### `error(...args)`

Log error (always logged, even when debug is disabled).

**Example:**
```javascript
import { enableDebug, warn, log } from 'ai-browser-test';

// Enable debug mode to see warnings
enableDebug();

// These will only log if debug is enabled
warn('Cache failed to load');
log('Processing screenshot');

// Errors always log
error('Critical failure');
```

## Configuration

### Environment Variables

- `VLM_PROVIDER`: Provider name ('gemini', 'openai', 'claude')
- `GEMINI_API_KEY`: Gemini API key
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `API_KEY`: Fallback API key

### Provider Priority

1. Explicit `VLM_PROVIDER` env var
2. Auto-detect from available API keys (prefers cheaper providers)
3. Default to 'gemini' (cheapest + free tier)

## Examples

### Basic Screenshot Validation

```javascript
import { validateScreenshot, createConfig } from 'ai-browser-test';

const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate this payment screen for usability and accessibility.',
  {
    testType: 'payment-screen',
    viewport: { width: 1280, height: 720 }
  }
);

console.log(`Score: ${result.score}/10`);
console.log(`Issues: ${result.issues?.length || 0}`);
```

### Persona-Based Testing

```javascript
import { experiencePageAsPersona } from 'ai-browser-test';
import { test } from '@playwright/test';

test('test from accessibility advocate perspective', async ({ page }) => {
  await page.goto('https://example.com');
  
  const experience = await experiencePageAsPersona(page, {
    name: 'Accessibility Advocate',
    goals: ['Check keyboard navigation', 'Verify screen reader compatibility'],
    device: 'desktop',
    timeScale: 'human'
  });
  
  console.log(`Experience score: ${experience.score}`);
  console.log(`Notes: ${experience.notes.length}`);
});
```

### Temporal Analysis (Gameplay Testing)

```javascript
import { captureTemporalScreenshots, aggregateTemporalNotes } from 'ai-browser-test';

// Capture screenshots over time
const screenshots = await captureTemporalScreenshots(page, {
  fps: 2,
  duration: 5000 // 5 seconds
});

// Aggregate temporal notes
const aggregated = aggregateTemporalNotes(notes, {
  windowSize: 10000,
  decayFactor: 0.9
});

console.log(`Coherence: ${aggregated.coherence}`);
console.log(`Trend: ${aggregated.trend}`);
```

### Multi-Modal Validation

```javascript
import { multiModalValidation } from 'ai-browser-test';

const result = await multiModalValidation(page, {
  prompt: 'Evaluate the overall user experience',
  includeScreenshot: true,
  includeHTML: true,
  includeCSS: true,
  includeRenderedCode: true
});

console.log(`Multi-modal score: ${result.score}`);
```

### Batch Optimization

```javascript
import { BatchOptimizer } from 'ai-browser-test';

const optimizer = new BatchOptimizer({ maxBatchSize: 5 });
const screenshots = ['img1.png', 'img2.png', 'img3.png'];

const batch = optimizer.selectBatch(screenshots.map(img => ({
  image: img,
  prompt: 'Evaluate this screenshot'
})));

// Process batch efficiently
for (const item of batch) {
  await validateScreenshot(item.image, item.prompt);
}
```

See `example.test.mjs` for more complete examples.

## Cost Management

The package includes cost tracking and caching to minimize API costs:

- **Caching**: Results are cached by default (7 day TTL)
- **Cost Estimation**: Each result includes cost estimate
- **Provider Selection**: Auto-selects cheapest available provider

## Deployment

### As Vercel Function

1. Deploy to Vercel: `vercel`
2. Set environment variables in Vercel dashboard
3. Access API at `https://your-site.vercel.app/api/validate`

### As Local Package

1. Install: `npm install file:../ai-browser-test`
2. Use in your tests: `import { validateScreenshot } from 'ai-browser-test'`

## Dependencies

### Peer Dependencies

- `@playwright/test` (optional) - Required for Playwright-dependent features like `multiModalValidation`, `extractRenderedCode`, etc.
- `@arclabs561/llm-utils` (optional) - Used internally for text-only LLM calls in data extraction. If not available, falls back to basic extraction methods.

### Local Development

For local development with linked packages:

```bash
# Link llm-utils (if developing both packages)
cd /path/to/llm-utils
npm link
cd /path/to/ai-browser-test
npm link @arclabs561/llm-utils

# Link ai-browser-test to your project
cd /path/to/ai-browser-test
npm link
cd /path/to/your-project
npm link ai-browser-test
```

## Research References

This package is based on research in:
- **Vision Language Models for Testing** - Using VLLMs for semantic screenshot validation
- **Temporal Aggregation** - Opinion propagation and coherence analysis over time
- **Multi-Perspective Evaluation** - Multiple personas evaluating same state
- **Context Compression** - Context-aware simplification for GUI agents (ICCV 2025)
- **LLM-as-a-Judge** - Using LLMs for automated evaluation

### Key Papers

- **ICCV 2025** - Context-Aware Simplification for GUI Agents (arXiv:2507.03730)
- **VETL** - LVLM-driven end-to-end web testing (arXiv:2410.12157)
- **LLM-as-a-Judge Bias** - Evaluating and Mitigating Bias (arXiv:2510.12462)
- **Ensemble Judging** - Multiple judges for consensus (various papers)
- **Temporal Aggregation** - Opinion propagation and coherence analysis
- **Multi-Perspective Evaluation** - Persona-based evaluation strategies

### Research-Based Features

This package implements research-backed best practices:

1. **Explicit Rubrics** - Improves reliability by 10-20% (Monte Carlo Data, Evidently AI)
2. **Bias Detection** - Detects superficial feature bias, position bias (arXiv:2510.12462)
3. **Ensemble Judging** - Multiple judges with consensus voting for higher accuracy
4. **Context Compression** - Aligned with ICCV 2025 research
5. **Temporal Aggregation** - Novel application to testing domain

## License

MIT

## Contributing

See `CONTRIBUTING.md` for guidelines.

## History

This package was initially motivated by the need for semantic screenshot validation in a web application, but has been designed from the ground up as a standalone, general-purpose tool for visual testing with AI-powered validation.
