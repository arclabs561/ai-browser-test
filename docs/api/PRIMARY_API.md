# Primary API: ai-visual-test

## Main Entry Point

The primary API is **`validateScreenshot()`** - this is the core function that all other features build upon.

```javascript
import { validateScreenshot } from 'ai-visual-test';

const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate this page for accessibility'
);
```

## API Hierarchy

### 1. Primary API (Core)

**`validateScreenshot(imagePath, prompt, context?)`**
- **Purpose**: Core validation function
- **Returns**: `ValidationResult` with score, issues, reasoning, uncertainty, confidence
- **Use when**: You have a screenshot and want to evaluate it

### 2. Convenience Functions (High-Level)

**`testGameplay(page, options)`**
- **Purpose**: Complete workflow for game testing
- **Use when**: Testing games with variable goals

**`testBrowserExperience(page, options)`**
- **Purpose**: Test browser experiences across stages
- **Use when**: Testing multi-stage user flows

**`validateWithGoals(imagePath, options)`**
- **Purpose**: Validate with variable goals
- **Use when**: You want flexible goal specification

### 3. Core Classes (Advanced)

**`VLLMJudge`**
- **Purpose**: Custom judge implementations
- **Use when**: You need fine-grained control

**`EnsembleJudge`**
- **Purpose**: Multi-provider ensemble judging
- **Use when**: You want maximum reliability

**`HumanValidationManager`**
- **Purpose**: Human feedback collection
- **Use when**: You need human calibration

## Documentation Site

The documentation site is served at `/docs-site/index.html` and uses ai-visual-test to test itself (meta-testing).

### Running the Documentation Site

```bash
# Option 1: Simple HTTP server
cd docs-site
python3 -m http.server 3000

# Option 2: Use the meta test script
node evaluation/meta-documentation-test.mjs
```

### Meta Testing

The documentation site includes a "meta test" section that demonstrates ai-visual-test testing itself. This is the "drink champagne / dog food" approach - using our own tool to validate our own documentation.

See `evaluation/meta-documentation-test.mjs` for the complete implementation.

## Quick Reference

| Function | Purpose | When to Use |
|----------|---------|-------------|
| `validateScreenshot()` | Core validation | Always - this is the primary API |
| `testGameplay()` | Game testing | Testing games |
| `testBrowserExperience()` | Multi-stage testing | Testing user flows |
| `validateWithGoals()` | Goal-based validation | When you need flexible goals |
| `VLLMJudge` | Custom implementation | Advanced use cases |
| `EnsembleJudge` | Multi-provider | Maximum reliability needed |

## Next Steps

1. **Start with `validateScreenshot()`** - This is the primary API
2. **Add goals** - Use `createGameGoal()` or goal objects for better results
3. **Enable uncertainty reduction** - Get confidence estimates
4. **Use convenience functions** - For common workflows

See [API_ESSENTIALS.md](./API_ESSENTIALS.md) for detailed examples.

