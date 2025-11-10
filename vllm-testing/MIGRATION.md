# Migration Guide: Updating Tests to Use @queeraoke/vllm-testing

## Quick Migration

### Step 1: Install Package

```bash
cd /Users/arc/Documents/dev/queeraoke
npm install ../../dev/vllm-testing
```

### Step 2: Update Imports

**Before:**
```javascript
import { validateScreenshotWithVLLM } from './vllm-screenshot-judge.mjs';
import { extractRenderedCode } from './helpers/multi-modal-validator.mjs';
import { aggregateTemporalNotes } from './helpers/temporal-aggregator.mjs';
```

**After:**
```javascript
import { 
  validateScreenshot,
  extractRenderedCode,
  aggregateTemporalNotes
} from '@queeraoke/vllm-testing';
```

### Step 3: Update Function Calls

**Before:**
```javascript
const result = await validateScreenshotWithVLLM(
  screenshotPath,
  'payment',
  { prompt: '...', testType: 'payment-screen' }
);
```

**After:**
```javascript
const result = await validateScreenshot(
  screenshotPath,
  'Evaluate this payment screen: ...',
  { testType: 'payment-screen', viewport: { width: 1280, height: 720 } }
);
```

## Detailed Migration Steps

### 1. Replace `validateScreenshotWithVLLM` with `validateScreenshot`

**Old API:**
```javascript
validateScreenshotWithVLLM(imagePath, testType, gameState)
```

**New API:**
```javascript
validateScreenshot(imagePath, prompt, context)
```

**Key Changes:**
- `testType` → `context.testType`
- `gameState.prompt` → `prompt` (first parameter)
- `gameState` → `context` (merged with other context)

### 2. Update Multi-Modal Imports

**Before:**
```javascript
import { comprehensiveMultiModalValidation } from './helpers/multi-modal-validator.mjs';
```

**After:**
```javascript
import { multiModalValidation, extractRenderedCode } from '@queeraoke/vllm-testing';
```

### 3. Update Temporal Aggregation

**Before:**
```javascript
import { aggregateTemporalNotes, formatNotesForPrompt } from './helpers/temporal-aggregator.mjs';
```

**After:**
```javascript
import { aggregateTemporalNotes, formatNotesForPrompt } from '@queeraoke/vllm-testing';
```

### 4. Update Configuration

**Before:**
```javascript
const VLLM_ENABLED = !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
```

**After:**
```javascript
import { createConfig } from '@queeraoke/vllm-testing';

const config = createConfig();
const VLLM_ENABLED = config.enabled;
```

## Example: Complete Test Migration

### Before:
```javascript
import { test, expect } from '@playwright/test';
import { validateScreenshotWithVLLM } from './vllm-screenshot-judge.mjs';
import { loadEnv } from './helpers/load-env.mjs';

loadEnv(import.meta.url);

test('payment screen', async ({ page }) => {
  await page.goto('https://queeraoke.fyi');
  await page.screenshot({ path: 'screenshot.png' });
  
  const result = await validateScreenshotWithVLLM('screenshot.png', 'payment', {
    prompt: 'Evaluate this payment screen...',
    testType: 'payment-screen'
  });
  
  expect(result.score).toBeGreaterThanOrEqual(7);
});
```

### After:
```javascript
import { test, expect } from '@playwright/test';
import { validateScreenshot } from '@queeraoke/vllm-testing';

test('payment screen', async ({ page }) => {
  await page.goto('https://queeraoke.fyi');
  await page.screenshot({ path: 'screenshot.png' });
  
  const result = await validateScreenshot(
    'screenshot.png',
    'Evaluate this payment screen...',
    {
      testType: 'payment-screen',
      viewport: { width: 1280, height: 720 }
    }
  );
  
  expect(result.score).toBeGreaterThanOrEqual(7);
});
```

## Files to Update

All test files that use VLLM should be updated:

1. `test/visual-regression-vllm.test.mjs`
2. `test/qr-avatar-ux.test.mjs`
3. `test/vllm-reactive-gameplay.test.mjs`
4. `test/vllm-interactive-game.test.mjs`
5. `test/vllm-comprehensive-journey.test.mjs`
6. `test/visual-hierarchy-attention.test.mjs`
7. `test/accessibility-visual-vllm.test.mjs`
8. `test/performance-visual-vllm.test.mjs`
9. `test/brick-breaker-comprehensive.test.mjs`
10. `test/interactive-web-experience.test.mjs`
11. And all other VLLM test files...

## Compatibility Layer

For gradual migration, use the compatibility layer:

```javascript
// test/helpers/vllm-compat.mjs
import { validateScreenshot } from '@queeraoke/vllm-testing';

export async function validateScreenshotWithVLLM(imagePath, testType, gameState = {}) {
  const prompt = gameState.prompt || `Evaluate this ${testType} screenshot.`;
  return validateScreenshot(imagePath, prompt, {
    testType,
    ...gameState
  });
}
```

Then update imports gradually:
```javascript
import { validateScreenshotWithVLLM } from './helpers/vllm-compat.mjs';
```

## Benefits of Migration

1. **Cleaner API**: More intuitive function signatures
2. **Better Organization**: All VLLM functionality in one package
3. **Easier Maintenance**: Core functionality in one place
4. **Reusability**: Can be used in other projects
5. **Documentation**: Clear API and usage examples
6. **Type Safety**: Can add TypeScript definitions later

## Next Steps

1. Install package: `npm install ../../dev/vllm-testing`
2. Update one test file at a time
3. Test thoroughly after each update
4. Remove old files once all tests migrated
5. Remove compatibility layer once migration complete

