# API Sub-Modules

The API is now organized into logical sub-modules for better tree-shaking and discoverability.

## Import Patterns

### Main Entry Point (All Exports)
```javascript
import { validateScreenshot, VLLMJudge } from 'ai-visual-test';
```

### Sub-Module Imports (Recommended)
```javascript
// Validators
import { StateValidator, AccessibilityValidator } from 'ai-visual-test/validators';

// Temporal
import { aggregateTemporalNotes, TemporalDecisionManager } from 'ai-visual-test/temporal';

// Multi-Modal
import { multiModalValidation, extractRenderedCode } from 'ai-visual-test/multi-modal';

// Ensemble
import { EnsembleJudge, detectBias } from 'ai-visual-test/ensemble';

// Persona
import { experiencePageAsPersona } from 'ai-visual-test/persona';

// Specs
import { parseSpec, executeSpec } from 'ai-visual-test/specs';

// Utils
import { getCacheStats, createConfig } from 'ai-visual-test/utils';
```

## Sub-Module Contents

### `ai-visual-test/validators`
All validation-related functionality:
- `StateValidator`, `AccessibilityValidator`
- `PromptBuilder`, `BatchValidator`
- Programmatic validators (contrast, keyboard, position)
- Hybrid validators (programmatic + VLLM)

### `ai-visual-test/temporal`
Temporal aggregation and decision-making:
- `aggregateTemporalNotes()`, `aggregateMultiScale()`
- `TemporalDecisionManager`, `TemporalPreprocessingManager`
- `captureTemporalScreenshots()`
- Temporal constants and errors

### `ai-visual-test/multi-modal`
Multi-modal validation features:
- `multiModalValidation()`, `extractRenderedCode()`
- `multiPerspectiveEvaluation()`
- Multi-modal fusion functions

### `ai-visual-test/ensemble`
Ensemble judging and bias detection:
- `EnsembleJudge`, `createEnsembleJudge()`
- `detectBias()`, `detectPositionBias()`
- `evaluateWithCounterBalance()`
- Research-enhanced validation

### `ai-visual-test/persona`
Persona-based testing:
- `experiencePageAsPersona()`, `experiencePageWithPersonas()`
- `createEnhancedPersona()`
- `ExperienceTrace`, `ExperienceTracerManager`

### `ai-visual-test/specs`
Natural language specifications:
- `parseSpec()`, `executeSpec()`
- `TEMPLATES`, `createSpecFromTemplate()`
- Spec config and validation

### `ai-visual-test/utils`
Utility functions and infrastructure:
- Cache, config, errors
- Type guards, metrics
- Cost tracking, batch optimization
- Uncertainty reduction

## Benefits

1. **Better Tree-Shaking**: Only import what you need
2. **Smaller Bundles**: Unused code excluded automatically
3. **Improved Discoverability**: Related functionality grouped together
4. **Clearer API Structure**: Easier to understand and navigate

## Migration

The main entry point (`ai-visual-test`) still exports everything for backward compatibility. You can gradually migrate to sub-module imports:

```javascript
// Old (still works)
import { StateValidator, aggregateTemporalNotes } from 'ai-visual-test';

// New (recommended)
import { StateValidator } from 'ai-visual-test/validators';
import { aggregateTemporalNotes } from 'ai-visual-test/temporal';
```

## TypeScript Support

All sub-modules have full TypeScript support. Types are automatically inferred from the main `index.d.ts` file.

