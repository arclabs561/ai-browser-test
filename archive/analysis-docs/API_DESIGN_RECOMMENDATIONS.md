# API Design Recommendations

Based on research of Playwright, testing frameworks (Vitest, Jest), and industry best practices.

## Key Findings from Research

### 1. Playwright's Error Handling Patterns

**Pattern:** Specific error types with clear handling
```javascript
try {
  await page.locator('.foo').waitFor();
} catch (e) {
  if (e instanceof playwright.errors.TimeoutError) {
    // Handle timeout specifically
  }
}
```

**Recommendation for ai-browser-test:**
- Create custom error classes: `ValidationError`, `CacheError`, `ConfigError`
- Use consistent error structure: `{ code, message, details }`
- Document which functions throw vs return error objects

### 2. Consistent Return Patterns

**Playwright pattern:**
- Methods return `null` on success, `Error` object on failure
- Clear distinction between "disabled" (returns object) vs "error" (throws)

**Current ai-browser-test:**
- `validateScreenshot` returns error object when disabled ✅
- `extractRenderedCode` throws error ❌ (inconsistent)

**Recommendation:**
- **Option A:** All functions return result objects with `{ success, error?, data? }`
- **Option B:** Document clearly which throw vs return (current approach, but needs docs)
- **Option C:** Use Playwright pattern: throw for errors, return objects for disabled/optional

### 3. Subpath Exports Best Practices

**Clerk pattern (from research):**
```json
{
  "exports": {
    ".": "./src/index.js",
    "./server": "./src/server.js",
    "./client": "./src/client.js"
  }
}
```

**Current ai-browser-test:**
```json
{
  "exports": {
    ".": "./src/index.mjs",
    "./judge": "./src/judge.mjs",
    "./multi-modal": "./src/multi-modal.mjs",
    "./temporal": "./src/temporal.mjs",
    "./cache": "./src/cache.mjs",
    "./config": "./src/config.mjs",
    "./load-env": "./src/load-env.mjs",
    "./persona-experience": "./src/persona-experience.mjs"
  }
}
```

**Recommendation:** ✅ Current structure is good, follows best practices

### 4. TypeScript Definitions

**Research finding:** Type safety is crucial for developer experience

**Recommendation:**
- Create `index.d.ts` with all type definitions
- Export types for advanced usage: `ValidationResult`, `ConfigOptions`, etc.
- Use discriminated unions for result types

### 5. Error Handling Consistency

**Research finding:** Consistent error responses are essential

**Current issues:**
- Some functions throw: `extractRenderedCode`, `captureTemporalScreenshots`
- Others return error objects: `validateScreenshot` (when disabled)
- No standardized error format

**Recommendation:**
```typescript
// Standard error structure
interface APIError {
  code: string;           // 'VALIDATION_ERROR', 'CACHE_ERROR', etc.
  message: string;        // Human-readable message
  details?: unknown;      // Additional context
  stack?: string;         // Stack trace in dev mode
}

// Result type for functions that don't throw
interface Result<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}
```

### 6. Utility Function Exposure

**Research finding:** Internal methods should be exposed as utilities if:
1. They're reimplemented by users (like `extractSemanticInfo`)
2. They're useful for advanced use cases
3. They don't expose internal state

**Current status:**
- ✅ `extractSemanticInfo` - Now exported (was reimplemented in queeraoke)
- ✅ `initCache`, `generateCacheKey` - Now exported
- ✅ `setConfig` - Now exported

**Additional candidates:**
- `buildPrompt` - Could be useful for custom prompt building
- `imageToBase64` - Simple utility, might be useful
- `estimateCost` - Useful for cost tracking

### 7. Documentation Patterns

**Research finding:** JSDoc + TypeScript definitions = best DX

**Recommendation:**
```javascript
/**
 * Validates a screenshot using VLLM
 * 
 * @param {string} imagePath - Path to screenshot file
 * @param {string} prompt - Evaluation prompt
 * @param {ValidationContext} [context={}] - Context options
 * @returns {Promise<ValidationResult>} Validation result
 * @throws {ValidationError} If image file not found or API call fails
 * 
 * @example
 * ```js
 * const result = await validateScreenshot(
 *   'screenshot.png',
 *   'Evaluate this screenshot',
 *   { testType: 'payment-screen' }
 * );
 * ```
 */
```

### 8. API Organization

**Current organization:** ✅ Good
- Core validation (2 exports)
- Multi-modal (4 exports)
- Temporal (3 exports)
- Cache (6 exports)
- Config (4 exports)
- Utilities (11 exports)

**Total: 30 exports** - Well-organized by category

## Specific Recommendations

### High Priority

1. **Standardize Error Handling**
   - Create error classes: `ValidationError`, `CacheError`, `ConfigError`
   - Document which functions throw vs return
   - Use consistent error structure

2. **Add TypeScript Definitions**
   - Create `index.d.ts`
   - Export all types
   - Use discriminated unions for results

3. **Complete JSDoc Documentation**
   - Add JSDoc to all exports
   - Include examples
   - Document error cases

### Medium Priority

4. **Consider Additional Utility Exports**
   - `buildPrompt` - For custom prompt building
   - `imageToBase64` - Simple utility
   - `estimateCost` - Cost tracking utility

5. **Error Handling Options**
   - Option A: All return result objects (more consistent)
   - Option B: Document current pattern clearly (less breaking changes)
   - **Recommendation: Option B** (less breaking, add docs)

### Low Priority

6. **Consider Plugin System**
   - Allow custom prompt builders
   - Allow custom cache backends
   - Allow custom providers

7. **Add Validation Helpers**
   - Input validation utilities
   - Schema validation for options
   - Type checking utilities

## Implementation Plan

### Phase 1: Error Standardization (Current)
- ✅ Export missing utilities
- ✅ Add sub-path exports
- ⚠️ Create error classes
- ⚠️ Document error patterns

### Phase 2: TypeScript Support
- ⚠️ Create `index.d.ts`
- ⚠️ Export all types
- ⚠️ Add type examples

### Phase 3: Documentation
- ⚠️ Complete JSDoc for all exports
- ⚠️ Add examples to README
- ⚠️ Document error handling patterns

### Phase 4: Advanced Features
- ⚠️ Consider additional utility exports
- ⚠️ Plugin system (if needed)
- ⚠️ Validation helpers

## Comparison with Similar Libraries

### Playwright
- ✅ Clear error types
- ✅ Consistent API patterns
- ✅ Excellent TypeScript support
- ✅ Comprehensive documentation

### Vitest/Jest
- ✅ Plugin system
- ✅ Extensible architecture
- ✅ Clear separation of concerns

### ai-browser-test (Current)
- ✅ Good organization
- ✅ Clear categories
- ⚠️ Needs error standardization
- ⚠️ Needs TypeScript definitions
- ⚠️ Needs complete documentation

## Conclusion

The API is **well-designed** with good organization. Main improvements needed:

1. **Error handling standardization** - Create error classes, document patterns
2. **TypeScript definitions** - Add `.d.ts` file with all types
3. **Complete documentation** - JSDoc + README examples

The current 30 exports are well-organized and follow good patterns. The main gap is consistency in error handling and documentation completeness.

