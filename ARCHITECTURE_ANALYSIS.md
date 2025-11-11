# Architecture Analysis: llm-utils → ai-browser-test → queeraoke

## Current Architecture

### Layer 1: llm-utils (Base)
- **Purpose**: Text-only LLM calls, provider detection, JSON extraction
- **Exports**: `detectProvider`, `callLLM`, `LLMClient`, `extractJSON`, `extractText`, `RateLimiter`
- **Dependencies**: None (pure utility)
- **.env handling**: Reads `process.env` directly (no .env file loading)
- **Used by**: ai-browser-test (internal only)

### Layer 2: ai-browser-test (Middle)
- **Purpose**: Browser testing with VLLM, multi-modal validation
- **Exports**: `validateScreenshot`, `VLLMJudge`, `multiModalValidation`, `BatchOptimizer`, etc.
- **Dependencies**: `@arclabs561/llm-utils` (internal use only)
- **.env handling**: Has `load-env.mjs`, loads .env before LLM calls
- **Used by**: queeraoke

### Layer 3: queeraoke (Application)
- **Purpose**: Application testing
- **Dependencies**: `ai-browser-test` (via npm link)
- **.env handling**: Has own `.env` file and `load-env.mjs` helper
- **Uses**: `validateScreenshot`, `createConfig`, `BatchOptimizer`, `aggregateTemporalNotes`, etc.

## Usage Patterns

### queeraoke → ai-browser-test
```javascript
// ✅ Good: Using public API
import { validateScreenshot, createConfig, BatchOptimizer } from 'ai-browser-test';
import { aggregateTemporalNotes, formatNotesForPrompt } from 'ai-browser-test';
import { extractRenderedCode, multiModalValidation } from 'ai-browser-test';
```

### ai-browser-test → llm-utils
```javascript
// ✅ Good: Internal use only, not exposed
// In scripts/check-docs-bloat.mjs
import { detectProvider, callLLM, extractJSON } from '@arclabs561/llm-utils';

// In scripts/validate-commit-msg.mjs
import { detectProvider, callLLM, extractJSON } from '@arclabs561/llm-utils';

// In src/data-extractor.mjs (optional import with fallback)
const llmUtils = await import('@arclabs561/llm-utils');
```

## Analysis: Is It Working Well?

### ✅ What's Working Well

1. **Clear Separation of Concerns**
   - llm-utils: Pure text LLM utility (agnostic)
   - ai-browser-test: Browser/VLLM testing (domain-specific)
   - queeraoke: Application (uses domain tools)

2. **Proper Encapsulation**
   - ai-browser-test doesn't expose llm-utils (keeps it internal)
   - queeraoke uses ai-browser-test's public API only
   - No cross-contamination

3. **Good Dependency Management**
   - llm-utils has zero dependencies (pure)
   - ai-browser-test depends on llm-utils (appropriate)
   - queeraoke depends on ai-browser-test (appropriate)

4. **Optional Import Pattern**
   - `data-extractor.mjs` uses try/catch for optional llm-utils import
   - Graceful fallback if package not available

### ⚠️ Potential Improvements

1. **.env Loading Pattern**
   - **Current**: llm-utils reads `process.env` directly, ai-browser-test loads .env
   - **Issue**: queeraoke has its own `load-env.mjs` helper
   - **Recommendation**: Export `loadEnv` from ai-browser-test so queeraoke can use it
   - **Rationale**: Avoid duplication, maintain consistency

2. **llm-utils Purity**
   - **Current**: No .env file loading (reads process.env only)
   - **Status**: ✅ **Correct** - Should stay pure
   - **Rationale**: Keeps it framework-agnostic, works in any environment

3. **Direct llm-utils Access**
   - **Current**: queeraoke doesn't use llm-utils directly
   - **Question**: Does queeraoke need direct text-only LLM calls?
   - **Answer**: Probably not - ai-browser-test covers its needs
   - **Status**: ✅ **Appropriate** - No need to expose llm-utils

4. **Shared Hooks/Config**
   - **Current**: Each repo has its own husky hooks (appropriate)
   - **Status**: ✅ **Correct** - Each package has different needs
   - **Note**: `validate-commit-msg.mjs` and `check-docs-bloat.mjs` are ai-browser-test specific

## Recommendations

### 1. Export `loadEnv` from ai-browser-test
```javascript
// In ai-browser-test/src/index.mjs (already exported ✅)
export { loadEnv } from './load-env.mjs';
```

**Status**: Already done! queeraoke can use it.

### 2. Keep llm-utils Pure
- ✅ **Correct**: No .env file loading
- ✅ **Correct**: Reads process.env directly
- ✅ **Correct**: Framework-agnostic

### 3. Maintain Current Separation
- ✅ **Correct**: ai-browser-test doesn't expose llm-utils
- ✅ **Correct**: queeraoke uses ai-browser-test's public API
- ✅ **Correct**: Each layer has clear responsibilities

### 4. Consider: Should ai-browser-test expose llm-utils?
**Answer**: ❌ **No**
- **Rationale**: 
  - ai-browser-test is for browser/VLLM testing
  - Text-only LLM calls are internal implementation detail
  - If queeraoke needs text-only LLM, it can depend on llm-utils directly
  - Keeps ai-browser-test focused on its domain

## Conclusion

**The architecture is working well and is appropriately designed.**

- ✅ Clear separation of concerns
- ✅ Proper encapsulation
- ✅ No unnecessary coupling
- ✅ Each package serves its purpose
- ✅ Dependencies flow in correct direction

**Minor improvements:**
1. ✅ `loadEnv` already exported from ai-browser-test
2. ✅ queeraoke can use `ai-browser-test/load-env` instead of own helper
3. ✅ Current design is clean and maintainable

**No major changes needed** - the modules are using each other appropriately within their contexts.

