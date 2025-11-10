# Comprehensive Needs Analysis: What Queeraoke Actually Needs

## Executive Summary

After reviewing all queeraoke tests (e2e and local), past errors, and documentation, the package needs to support:

1. **Browser/Playwright Integration** (CRITICAL) - 7629 matches in codebase
2. **Multi-Modal Validation** (ESSENTIAL) - Screenshot + HTML + CSS + rendered code
3. **Built-in Prompts/Wisdoms** (PLUGGABLE) - Brutalist, Josh Comeau, product purpose
4. **Context/Hooks/Encoding** (USEFUL) - Context compression, state history, temporal aggregation
5. **Temporal/Gameplay** (IMPORTANT) - Screenshot capture over time, gameplay testing

**The name should reflect browser/Playwright integration, not just "screenshot" or "interactive".**

## 1. Browser/Playwright Integration (CRITICAL)

### What Queeraoke Uses

**Playwright Features:**
- `page.evaluate()` - Extract rendered HTML/CSS
- `page.screenshot()` - Capture screenshots
- `page.setViewportSize()` - Viewport management (mobile/tablet/desktop)
- `page.goto()` - Navigation
- `page.waitForSelector()` - Wait for elements
- `page.fill()`, `page.click()` - Interaction

**Browser-Specific Features:**
- Viewport management (375x667 mobile, 1280x720 desktop)
- Device emulation (mobile/tablet/desktop)
- Dark mode detection
- Browser-specific rendering differences
- Cross-browser testing

### What the Package Should Expose

```javascript
import { testBrowser, validateBrowser } from 'ai-browser-test';

// Browser/Playwright integration
const result = await testBrowser(page, {
  viewport: { width: 1280, height: 720 },
  device: 'desktop',
  darkMode: false,
  browser: 'chromium'
});

// Viewport management
await setViewport(page, { width: 375, height: 667 }); // Mobile
await setViewport(page, { width: 1280, height: 720 }); // Desktop

// Device emulation
await emulateDevice(page, 'iPhone SE');
await emulateDevice(page, 'iPad Pro');
```

## 2. Multi-Modal Validation (ESSENTIAL)

### What Queeraoke Uses

**Multi-Modal Inputs:**
- Screenshot (visual representation)
- Rendered HTML (DOM structure)
- Rendered CSS (computed styles)
- DOM structure (element positions, counts)
- Game state (state consistency)
- Principles (design alignment)

**Example from queeraoke:**
```javascript
const renderedCode = await extractRenderedCode(page);
const screenshotPath = await page.screenshot({ path: 'test.png' });
const gameState = await page.evaluate(() => window.gameState);

const result = await validateScreenshot(screenshotPath, prompt, {
  renderedCode,
  gameState,
  principles: brutalistCriteria
});
```

### What the Package Should Expose

```javascript
import { validateMultiModal, extractRenderedCode } from 'ai-browser-test';

// Multi-modal validation
const result = await validateMultiModal(page, {
  screenshot: true,
  html: true,
  css: true,
  dom: true,
  state: true,
  principles: brutalistCriteria
});

// Extract rendered code
const renderedCode = await extractRenderedCode(page);
// Returns: { html, css, domStructure, computedStyles }
```

## 3. Built-in Prompts/Wisdoms (PLUGGABLE)

### What Queeraoke Uses

**Prompt Templates:**
- `prompt-templates.mjs` - Brutalist criteria, product purpose, Josh Comeau principles
- Pluggable/extensible - Can add new templates
- Reusable - Reduces token costs (~60% reduction)

**Example from queeraoke:**
```javascript
import { buildBrutalistCriteriaReference, buildProductPurposeReference } from './helpers/prompt-templates.mjs';

const prompt = buildComprehensivePrompt(specificPrompt, {
  brutalist: true,
  productPurpose: true,
  joshComeau: true
});
```

### What the Package Should Expose

```javascript
import { createPromptTemplate, useBuiltInPrompts } from 'ai-browser-test';

// Built-in prompts (pluggable)
const brutalistPrompt = useBuiltInPrompts('brutalist');
const joshComeauPrompt = useBuiltInPrompts('josh-comeau');
const productPurposePrompt = useBuiltInPrompts('product-purpose');

// Custom prompts (extensible)
const customPrompt = createPromptTemplate({
  name: 'custom',
  criteria: [...],
  requirements: [...],
  scoring: [...]
});

// Combine prompts
const combinedPrompt = buildComprehensivePrompt(specificPrompt, {
  templates: [brutalistPrompt, joshComeauPrompt, productPurposePrompt]
});
```

## 4. Context/Hooks/Encoding (USEFUL)

### What Queeraoke Uses

**Context Compression:**
- `context-compressor.mjs` - Compress historical context
- State history propagation
- Temporal aggregation
- Multi-perspective evaluation

**Example from queeraoke:**
```javascript
import { compressContext, compressStateHistory } from './helpers/context-compressor.mjs';

const compressed = compressContext(notes, {
  maxTokens: 500,
  maxNotes: 10,
  includeRecent: true,
  includeKeyEvents: true
});

const compressedState = compressStateHistory(stateHistory, {
  maxStates: 3,
  includeFirst: true,
  includeLast: true,
  includeKeyTransitions: true
});
```

### What the Package Should Expose

```javascript
import { compressContext, compressStateHistory, createContextHook } from 'ai-browser-test';

// Context compression
const compressed = compressContext(notes, {
  maxTokens: 500,
  aggregationStrategy: 'temporal' // or 'semantic', 'importance'
});

// State history compression
const compressedState = compressStateHistory(stateHistory, {
  maxStates: 3,
  includeKeyTransitions: true
});

// Context hooks (for encoding/hydration)
const contextHook = createContextHook({
  encode: (context) => compressContext(context),
  decode: (compressed) => expandContext(compressed),
  hydrate: (context, state) => mergeContextAndState(context, state)
});
```

## 5. Temporal/Gameplay (IMPORTANT)

### What Queeraoke Uses

**Temporal Capture:**
- `captureTemporalScreenshots()` - Screenshots over time
- Temporal aggregation
- Gameplay testing
- Animation validation

**Example from queeraoke:**
```javascript
import { captureTemporalScreenshots, aggregateTemporalNotes } from 'ai-browser-test';

const screenshots = await captureTemporalScreenshots(page, 2, 2000); // 2 fps, 2 seconds
const aggregated = aggregateTemporalNotes(notes, {
  windowSize: 10000,
  decayFactor: 0.9
});
```

### What the Package Should Expose

```javascript
import { captureTemporalScreenshots, testGameplay } from 'ai-browser-test';

// Temporal capture
const screenshots = await captureTemporalScreenshots(page, {
  fps: 2,
  duration: 2000,
  viewport: { width: 1280, height: 720 }
});

// Gameplay testing
const gameplayResult = await testGameplay(page, {
  duration: 30000,
  fps: 2,
  personas: [...],
  validateFn: validateScreenshot
});
```

## Name Recommendation

### Current Name: `ai-browser-test`

**Score: 6/10**
- ✅ Clear for static screenshots
- ❌ Doesn't emphasize browser/Playwright
- ❌ Doesn't convey multi-modal
- ❌ Doesn't convey built-in prompts

### Better Name: `ai-browser-test` or `ai-browser-validate`

**Score: 9/10**

**Why:**
1. **Browser-focused** - Emphasizes Playwright/browser integration (critical)
2. **Not screenshot-limited** - Works for multi-modal (HTML + CSS + rendered)
3. **Clear purpose** - Obvious what it does
4. **Extensible** - Built-in prompts/wisdoms are pluggable
5. **Context-aware** - Supports context/hooks/encoding

**Alternative: `ai-playwright-visual`**
- Emphasizes Playwright + visual
- But "visual" might limit to screenshots

**Final Recommendation: `ai-browser-test`**

## What the Package Should Expose

### Core APIs

```javascript
// Browser/Playwright integration
export { testBrowser, validateBrowser, setViewport, emulateDevice } from './browser.mjs';

// Multi-modal validation
export { validateMultiModal, extractRenderedCode, captureRenderedCode } from './multi-modal.mjs';

// Built-in prompts (pluggable)
export { createPromptTemplate, useBuiltInPrompts, buildComprehensivePrompt } from './prompts.mjs';

// Context/hooks/encoding
export { compressContext, compressStateHistory, createContextHook } from './context.mjs';

// Temporal/gameplay
export { captureTemporalScreenshots, testGameplay, aggregateTemporalNotes } from './temporal.mjs';

// Core validation
export { validateScreenshot, VLLMJudge, createConfig } from './judge.mjs';
```

### Built-in Prompts (Pluggable)

```javascript
// Built-in prompt templates
export const BUILT_IN_PROMPTS = {
  brutalist: {
    criteria: [...],
    requirements: [...],
    scoring: [...]
  },
  joshComeau: {
    principles: [...],
    techniques: [...],
    scoring: [...]
  },
  productPurpose: {
    context: [...],
    values: [...],
    alignment: [...]
  }
};

// Extensible - users can add their own
export function createPromptTemplate(template) {
  // Register new template
}
```

## Next Steps

1. **Rename package** - `ai-browser-test` (recommended)
2. **Add browser/Playwright integration** - Viewport, device emulation, page interaction
3. **Add multi-modal validation** - HTML + CSS + rendered code extraction
4. **Add built-in prompts** - Pluggable prompt templates (brutalist, Josh Comeau, etc.)
5. **Add context/hooks** - Context compression, state history, encoding/hydration
6. **Keep temporal/gameplay** - Already implemented, just needs better integration

