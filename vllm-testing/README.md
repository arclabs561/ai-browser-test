# @queeraoke/vllm-testing

Visual testing utilities using Vision Language Models (VLLM) for screenshot validation with Playwright.

**Language: JavaScript (ES Modules)** - Aligned with Playwright ecosystem and existing codebase.

## Why JavaScript (ES Modules)?

Based on research and ecosystem analysis:

1. **Playwright Native Support**: JavaScript/TypeScript are the primary languages for Playwright, with best API coverage
2. **Zero Compilation**: Direct execution with `.mjs` files, faster iteration
3. **Ecosystem Alignment**: Matches Node.js/npm/Vercel ecosystem perfectly
4. **Existing Codebase**: All test files already use `.mjs` (112 files in codebase)
5. **Industry Standard**: Most Playwright packages use JavaScript/TypeScript
6. **TypeScript Optional**: Can add `.d.ts` files later for type safety without compilation

## Installation

```bash
# As a local package (recommended for monorepos)
npm install file:./packages/vllm-testing

# Or from npm (if published)
npm install @queeraoke/vllm-testing
```

## Quick Start

```javascript
import { validateScreenshot, createConfig } from '@queeraoke/vllm-testing';

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

console.log(`Score: ${result.score}/10`);
console.log(`Issues: ${result.issues.join(', ')}`);
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

**Parameters:**
- `page` (Page): Playwright page object

**Returns:**
- `Promise<Object>`: Rendered code structure

#### `captureTemporalScreenshots(page, fps, duration)`

Captures temporal screenshots for animation validation.

**Parameters:**
- `page` (Page): Playwright page object
- `fps` (number): Frames per second (default: 2)
- `duration` (number): Duration in ms (default: 2000)

**Returns:**
- `Promise<Array>`: Array of screenshot paths

#### `multiPerspectiveEvaluation(validateFn, screenshotPath, renderedCode, gameState, personas)`

Evaluates screenshot from multiple perspectives.

**Parameters:**
- `validateFn` (Function): Validation function
- `screenshotPath` (string): Path to screenshot
- `renderedCode` (Object): Rendered code structure
- `gameState` (Object): Game state (optional)
- `personas` (Array): Array of persona objects (optional)

**Returns:**
- `Promise<Array>`: Array of evaluations

### Temporal Aggregation

#### `aggregateTemporalNotes(notes, options)`

Aggregates notes temporally with coherence checking.

**Parameters:**
- `notes` (Array): Array of note objects
- `options` (Object):
  - `windowSize` (number): Window size in ms (default: 10000)
  - `decayFactor` (number): Decay factor (default: 0.9)
  - `coherenceThreshold` (number): Coherence threshold (default: 0.7)

**Returns:**
- `Object`: Aggregated notes with coherence analysis

#### `formatNotesForPrompt(aggregated)`

Formats aggregated notes for VLLM prompt.

**Parameters:**
- `aggregated` (Object): Aggregated notes object

**Returns:**
- `string`: Formatted prompt text

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

### Basic Usage

```javascript
import { validateScreenshot } from '@queeraoke/vllm-testing';

const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate this screenshot for quality.',
  { testType: 'payment-screen' }
);
```

### With Multi-Modal Validation

```javascript
import { 
  validateScreenshot, 
  extractRenderedCode,
  multiPerspectiveEvaluation 
} from '@queeraoke/vllm-testing';
import { test } from '@playwright/test';

test('payment screen', async ({ page }) => {
  await page.goto('https://example.com');
  await page.screenshot({ path: 'screenshot.png' });
  
  const renderedCode = await extractRenderedCode(page);
  const validateFn = (path, prompt, context) => 
    validateScreenshot(path, prompt, context);
  
  const evaluations = await multiPerspectiveEvaluation(
    validateFn,
    'screenshot.png',
    renderedCode
  );
});
```

### With Temporal Aggregation

```javascript
import { 
  aggregateTemporalNotes, 
  formatNotesForPrompt 
} from '@queeraoke/vllm-testing';

const notes = [
  { timestamp: Date.now(), score: 8, observation: 'Good' },
  { timestamp: Date.now() + 5000, score: 9, observation: 'Better' }
];

const aggregated = aggregateTemporalNotes(notes);
const prompt = formatNotesForPrompt(aggregated);
```

## Cost Management

The package includes cost tracking and caching to minimize API costs:

- **Caching**: Results are cached by default (7 day TTL)
- **Cost Estimation**: Each result includes cost estimate
- **Provider Selection**: Auto-selects cheapest available provider

## License

MIT

