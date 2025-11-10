# Package Rename Complete: ai-browser-test

## Summary

Successfully renamed package from `ai-screenshot-test` to `ai-browser-test` and published to npm.

## What Changed

### Package Name
- **Old:** `ai-screenshot-test`
- **New:** `ai-browser-test`

### Why the Change

The new name better reflects the package's capabilities:
1. **Browser/Playwright Integration** - Not just screenshots, full browser automation
2. **Multi-Modal Validation** - Screenshot + HTML + CSS + rendered code + DOM structure
3. **Persona-Based Experience Testing** - Test page experience from different persona perspectives
4. **Human-Interpreted Time Scales** - Reading time, interaction time, not just mechanical fps
5. **Built-in Prompts** - Pluggable prompt templates (brutalist, Josh Comeau, etc.)
6. **Context/Hooks/Encoding** - Context compression, state history, temporal aggregation

### New Features Added

1. **Persona-Based Experience Testing**
   - `experiencePageAsPersona()` - Test page experience from persona perspective
   - `experiencePageWithPersonas()` - Test page experience with multiple personas
   - Human-interpreted time scales (reading time, interaction time) vs mechanical fps

2. **Human-Interpreted Time Scales**
   - Page load time: 1-5 seconds (based on complexity)
   - Reading time: Based on content length (200-300 words per minute)
   - Interaction time: Based on interaction type (click: 500ms, type: 1000ms, scroll: 800ms)

## Published Versions

- **v0.1.0** - Initial release as `ai-browser-test`
- **v0.1.1** - Updated description and keywords, added persona experience testing

## Updated Files

### Package Files
- `package.json` - Name, description, keywords
- `README.md` - Updated title, installation, examples
- `CHANGELOG.md` - Added v0.1.1 entry
- `src/index.mjs` - Updated JSDoc comments
- `example.test.mjs` - Updated imports

### New Files
- `src/persona-experience.mjs` - Persona-based experience testing

### Queeraoke Updates
- `package.json` - Updated dependency
- All test files - Updated imports from `ai-screenshot-test` to `ai-browser-test`

## Installation

```bash
npm install ai-browser-test
```

## Usage

```javascript
import { 
  validateScreenshot, 
  experiencePageAsPersona,
  extractRenderedCode 
} from 'ai-browser-test';

// Persona-based experience testing
const experience = await experiencePageAsPersona(page, {
  name: 'Casual Gamer',
  perspective: 'I play games occasionally for fun.',
  goals: ['Easy to understand', 'Quick to start'],
  device: 'desktop'
}, {
  timeScale: 'human', // Human-interpreted time scales
  captureScreenshots: true,
  captureState: true,
  captureCode: true
});
```

## Next Steps

1. ✅ Package renamed and published
2. ✅ Queeraoke updated to use new package
3. ⏳ Add built-in prompts system (pluggable templates)
4. ⏳ Add browser/Playwright integration helpers (setViewport, emulateDevice)
5. ⏳ Add ArXiv bibliography with links

## Status

✅ **Complete** - Package renamed, published, and queeraoke updated.

