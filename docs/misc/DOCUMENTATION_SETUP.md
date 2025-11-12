# Documentation Setup: Auto-Generated from Code

## Overview

Documentation is **auto-generated from TSDoc/JSDoc comments** using **TypeDoc**, the modern standard for TypeScript/JavaScript ES modules (2025).

## Why TypeDoc?

Based on 2025 best practices research:

- ✅ **Modern standard** - Recommended for ES modules and TypeScript
- ✅ **Native ES module support** - Works with `.mjs` files
- ✅ **Type-aware** - Understands types from JSDoc comments
- ✅ **TSDoc compatible** - Supports Microsoft's TSDoc standard
- ✅ **Backward compatible** - Works with existing JSDoc comments
- ✅ **Better output** - Modern HTML with search, navigation, type info
- ✅ **Active development** - Regular updates for new TypeScript features

## Quick Start

```bash
# Generate docs
npm run docs

# Direct TypeDoc command
npm run docs:typedoc

# Watch mode (auto-regenerate on changes)
npm run docs:watch
```

## Configuration

TypeDoc is configured via `typedoc.json`:

- **Entry point**: `src/index.mjs` (main API exports)
- **Output**: `docs-generated/` (full documentation)
- **Includes**: Project documents from `docs/` folder
- **ES module support**: Configured for ES2022 modules

## Documentation Standards

### JSDoc Style (Current, Works)

```javascript
/**
 * Validate a screenshot using Vision Language Models
 * 
 * @param {string | string[]} imagePath - Single image path or array for comparison
 * @param {string} prompt - Evaluation prompt
 * @param {import('./index.mjs').ValidationContext} [context={}] - Validation context
 * @returns {Promise<import('./index.mjs').ValidationResult>} Validation result
 * 
 * @example
 * ```javascript
 * const result = await validateScreenshot('screenshot.png', 'Evaluate this page');
 * console.log(result.score); // 0-10
 * ```
 */
export async function validateScreenshot(imagePath, prompt, context = {}) {
  // ...
}
```

### TSDoc Style (Recommended, Modern)

```typescript
/**
 * Validate a screenshot using Vision Language Models
 * 
 * @param imagePath - Single image path or array for comparison
 * @param prompt - Evaluation prompt
 * @param context - Validation context (optional)
 * @returns Validation result with score, issues, and reasoning
 * 
 * @example
 * ```typescript
 * const result = await validateScreenshot('screenshot.png', 'Evaluate this page');
 * console.log(result.score); // 0-10
 * ```
 */
```

## What Gets Documented

- ✅ **Public functions** - All exported functions
- ✅ **Classes** - All exported classes with methods
- ✅ **Types** - Type definitions (via JSDoc `@typedef` or TypeScript)
- ✅ **Examples** - Code examples via `@example` tags
- ✅ **Project docs** - Markdown files from `docs/` folder

## Integration with Docs Site

The generated docs are embedded in `docs-site/api-reference.html` which:
- Links to full TypeDoc documentation
- Provides quick access to API reference
- Integrates with the meta-testing framework

## Meta-Testing

The documentation site uses ai-visual-test to test itself:

```bash
# Test the docs site with ai-visual-test
node evaluation/meta-documentation-test.mjs
```

This demonstrates "drink champagne / dog food" - using our own tool to validate our own documentation.

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Generate docs
  run: npm run docs
  
- name: Check docs are up to date
  run: git diff --exit-code docs-generated/
```

This ensures docs are always generated and committed.

## References

- **TypeDoc**: https://typedoc.org/
- **TSDoc**: https://tsdoc.org/ (Microsoft standard)
- **JSDoc**: https://jsdoc.app/ (backward compatible)

