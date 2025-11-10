# Final Name Recommendation v2: Based on Comprehensive Needs Analysis

## Analysis Summary

After reviewing all queeraoke tests (e2e and local), past errors, and documentation:

### What Queeraoke Actually Needs

1. **Browser/Playwright Integration** (CRITICAL) - 7629 matches in codebase
   - Viewport management, device emulation, page interaction
   - NOT just screenshots - full browser automation

2. **Multi-Modal Validation** (ESSENTIAL)
   - Screenshot + HTML + CSS + rendered code + DOM structure
   - NOT just visual - implementation validation too

3. **Built-in Prompts/Wisdoms** (PLUGGABLE)
   - Brutalist, Josh Comeau, product purpose templates
   - Extensible - users can add their own

4. **Context/Hooks/Encoding** (USEFUL)
   - Context compression, state history, temporal aggregation
   - Hydrated prompts with CSS + HTML + rendered

5. **Temporal/Gameplay** (IMPORTANT)
   - Screenshot capture over time, gameplay testing
   - But NOT the only thing

## Name Options

### Option 1: `ai-browser-test` (BEST)

**Score: 9/10**

**Why:**
- ✅ **Browser-focused** - Emphasizes Playwright/browser integration (critical)
- ✅ **Not screenshot-limited** - Works for multi-modal (HTML + CSS + rendered)
- ✅ **Clear purpose** - Obvious what it does
- ✅ **Extensible** - Built-in prompts/wisdoms are pluggable
- ✅ **Context-aware** - Supports context/hooks/encoding
- ✅ **Short and memorable** - Easy to type, easy to remember

**What it conveys:**
- Browser automation (Playwright)
- Visual validation (screenshots)
- Multi-modal (HTML + CSS + rendered)
- Built-in prompts (pluggable)
- Context/hooks (compression, state history)

**Usage:**
```bash
npm install ai-browser-test
```

```javascript
import { testBrowser, validateBrowser, useBuiltInPrompts } from 'ai-browser-test';
```

### Option 2: `ai-browser-validate`

**Score: 8/10**

**Why:**
- ✅ Emphasizes validation aspect
- ✅ Browser-focused
- ❌ Slightly longer than `ai-browser-test`
- ❌ "validate" might imply only validation, not testing

### Option 3: `ai-playwright-visual`

**Score: 7/10**

**Why:**
- ✅ Emphasizes Playwright integration
- ✅ Emphasizes visual aspect
- ❌ "visual" might limit to screenshots only
- ❌ Doesn't convey multi-modal (HTML + CSS + rendered)
- ❌ Longer than `ai-browser-test`

### Option 4: `ai-browser-test` (CURRENT)

**Score: 6/10**

**Why:**
- ✅ Clear for static screenshots
- ❌ Doesn't emphasize browser/Playwright
- ❌ Doesn't convey multi-modal
- ❌ Doesn't convey built-in prompts
- ❌ "screenshot" limits to visual only

## Final Recommendation

### **`ai-browser-test`** (BEST)

**Why:**
1. **Covers all use cases** - Browser, visual, multi-modal, prompts, context
2. **Clear purpose** - Obvious what it does
3. **Not limited** - Works for screenshots, HTML, CSS, rendered code, gameplay, temporal
4. **Extensible** - Built-in prompts/wisdoms are pluggable
5. **Short and memorable** - Easy to type, easy to remember

**What it should expose:**
```javascript
// Browser/Playwright integration
import { testBrowser, validateBrowser, setViewport, emulateDevice } from 'ai-browser-test';

// Multi-modal validation
import { validateMultiModal, extractRenderedCode } from 'ai-browser-test';

// Built-in prompts (pluggable)
import { useBuiltInPrompts, createPromptTemplate } from 'ai-browser-test';

// Context/hooks/encoding
import { compressContext, createContextHook } from 'ai-browser-test';

// Temporal/gameplay
import { captureTemporalScreenshots, testGameplay } from 'ai-browser-test';
```

## Next Steps

1. **Rename package** - `ai-browser-test` (recommended)
2. **Add browser/Playwright integration** - Viewport, device emulation, page interaction
3. **Add multi-modal validation** - HTML + CSS + rendered code extraction
4. **Add built-in prompts** - Pluggable prompt templates (brutalist, Josh Comeau, etc.)
5. **Add context/hooks** - Context compression, state history, encoding/hydration
6. **Keep temporal/gameplay** - Already implemented, just needs better integration

