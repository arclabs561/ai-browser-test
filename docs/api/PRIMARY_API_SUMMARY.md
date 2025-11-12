# Primary API Summary

## Main Entry Point

**`validateScreenshot(imagePath, prompt, context?)`** - This is the primary API.

```javascript
import { validateScreenshot } from 'ai-visual-test';

const result = await validateScreenshot('screenshot.png', 'Evaluate this page');
// result.score: 0-10
// result.issues: Array of issues
// result.uncertainty: 0-1 (confidence in judgment)
// result.confidence: 0-1 (how confident we are)
```

## API Hierarchy

1. **Primary**: `validateScreenshot()` - Core validation
2. **Convenience**: `testGameplay()`, `testBrowserExperience()`, `validateWithGoals()` - High-level workflows
3. **Classes**: `VLLMJudge`, `EnsembleJudge`, `HumanValidationManager` - Advanced use cases

## Documentation

- **Auto-generated**: `npm run docs` - Generates from TSDoc/JSDoc comments using TypeDoc
- **Docs site**: `docs-site/index.html` - Interactive documentation with meta-testing
- **API reference**: `docs-generated/` - Full TypeDoc-generated API reference

## Meta-Testing

The documentation site uses ai-visual-test to test itself:

```bash
node evaluation/meta-documentation-test.mjs
```

This demonstrates "drink champagne / dog food" - using our own tool to validate our own documentation.

