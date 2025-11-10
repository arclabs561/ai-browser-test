# ai-browser-test

Browser testing utilities using Vision Language Models (VLLM) for multi-modal validation with Playwright.

[![GitHub](https://img.shields.io/github/license/henrywallace/ai-browser-test)](https://github.com/henrywallace/ai-browser-test)
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
npm install git+https://github.com/henrywallace/ai-browser-test.git
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

See `example.test.mjs` for complete examples.

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
2. Use in your tests: `import { validateScreenshot } from '@visual-ai/validate'`

## Research References

This package is based on research in:
- **Vision Language Models for Testing** - Using VLLMs for semantic screenshot validation
- **Temporal Aggregation** - Opinion propagation and coherence analysis over time
- **Multi-Perspective Evaluation** - Multiple personas evaluating same state
- **Context Compression** - Context-aware simplification for GUI agents (ICCV 2025)
- **LLM-as-a-Judge** - Using LLMs for automated evaluation

### Key Papers

- **ICCV 2025** - Context-Aware Simplification for GUI Agents
- **Temporal Aggregation** - Opinion propagation and coherence analysis
- **Multi-Perspective Evaluation** - Persona-based evaluation strategies
- **LLM-as-a-Judge** - Automated evaluation using language models

*Note: Full bibliography with ArXiv links coming soon.*

## License

MIT

## Contributing

See `CONTRIBUTING.md` for guidelines.

## History

This package was initially motivated by the need for semantic screenshot validation in a web application, but has been designed from the ground up as a standalone, general-purpose tool for visual testing with AI-powered validation.
