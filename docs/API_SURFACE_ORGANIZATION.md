# API Surface Organization Plan

Based on research into best practices for organizing large JavaScript API surfaces (150+ exports), this document outlines recommendations for improving the API organization.

## Current State

- **Total Exports**: ~150+ functions, classes, constants, types
- **Organization**: Flat barrel file (`src/index.mjs`)
- **TypeScript**: Complete definitions in `index.d.ts`
- **Documentation**: Comprehensive but could benefit from better grouping

## Problems with Current Approach

1. **Barrel File Anti-Pattern**: Exporting everything from a single index file prevents proper tree-shaking
2. **Large Bundle Size**: Consumers may include unused code
3. **Discoverability**: Hard to find related functionality among 150+ exports
4. **Maintenance**: Difficult to understand API structure at a glance

## Recommended Approach: Sub-Module Organization

### Strategy: Use package.json "exports" Field

Instead of a single barrel file, organize exports into logical sub-modules:

```json
{
  "exports": {
    ".": "./src/index.mjs",
    "./validators": "./src/validators/index.mjs",
    "./temporal": "./src/temporal/index.mjs",
    "./multi-modal": "./src/multi-modal/index.mjs",
    "./ensemble": "./src/ensemble/index.mjs",
    "./persona": "./src/persona/index.mjs",
    "./specs": "./src/specs/index.mjs",
    "./utils": "./src/utils/index.mjs"
  }
}
```

### Proposed Module Structure

#### 1. Core API (`./`)
**Purpose**: Primary entry point, most commonly used functions
- `validateScreenshot()` - Main validation function
- `VLLMJudge` - Core judge class
- `extractSemanticInfo()` - Semantic extraction

#### 2. Validators (`./validators`)
**Purpose**: All validation-related functionality
- `StateValidator`
- `AccessibilityValidator`
- `PromptBuilder`
- `BatchValidator`
- Programmatic validators (contrast, keyboard, position)
- Hybrid validators

#### 3. Temporal (`./temporal`)
**Purpose**: Temporal aggregation and decision-making
- `aggregateTemporalNotes()`
- `TemporalDecisionManager`
- `TemporalPreprocessingManager`
- `captureTemporalScreenshots()`
- All temporal-related functions

#### 4. Multi-Modal (`./multi-modal`)
**Purpose**: Multi-modal validation features
- `multiModalValidation()`
- `extractRenderedCode()`
- `multiPerspectiveEvaluation()`
- Multi-modal fusion functions

#### 5. Ensemble (`./ensemble`)
**Purpose**: Ensemble judging and bias detection
- `EnsembleJudge`
- `detectBias()`
- `detectPositionBias()`
- `evaluateWithCounterBalance()`

#### 6. Persona (`./persona`)
**Purpose**: Persona-based testing
- `experiencePageAsPersona()`
- `experiencePageWithPersonas()`
- `createEnhancedPersona()`
- Persona-related utilities

#### 7. Specs (`./specs`)
**Purpose**: Natural language specifications
- `parseSpec()`
- `executeSpec()`
- `TEMPLATES`
- `createSpecFromTemplate()`
- Spec-related functions

#### 8. Utils (`./utils`)
**Purpose**: Utility functions and helpers
- Cache functions
- Config functions
- Error classes
- Type guards
- Metrics functions
- Cost tracking

### Migration Strategy

**Phase 1: Add Sub-Module Exports (Non-Breaking)**
- Add new export paths to `package.json`
- Keep main export (`"."`) unchanged
- Create sub-module index files
- Document new import paths

**Phase 2: Update Documentation**
- Update examples to show sub-module imports
- Add migration guide
- Update TypeScript definitions

**Phase 3: Deprecate Flat Imports (Future)**
- Mark flat imports as deprecated
- Encourage sub-module imports
- Eventually remove flat exports (major version)

### Benefits

1. **Better Tree-Shaking**: Consumers only import what they need
2. **Improved Discoverability**: Related functionality grouped together
3. **Smaller Bundle Sizes**: Unused code excluded from builds
4. **Clearer API Structure**: Easier to understand and navigate
5. **Better Performance**: Faster module resolution

### Example Usage

**Before (Current)**:
```javascript
import { 
  validateScreenshot, 
  StateValidator, 
  aggregateTemporalNotes,
  EnsembleJudge 
} from 'ai-visual-test';
```

**After (Recommended)**:
```javascript
import { validateScreenshot } from 'ai-visual-test';
import { StateValidator } from 'ai-visual-test/validators';
import { aggregateTemporalNotes } from 'ai-visual-test/temporal';
import { EnsembleJudge } from 'ai-visual-test/ensemble';
```

### Implementation Notes

1. **Backward Compatibility**: Keep main export for existing users
2. **TypeScript Support**: Update `index.d.ts` to support sub-modules
3. **Documentation**: Clear examples for both import styles
4. **Gradual Migration**: Allow time for ecosystem to adapt

## Next Steps

1. ✅ Research best practices (completed)
2. ⏳ Create sub-module index files
3. ⏳ Update package.json exports field
4. ⏳ Update TypeScript definitions
5. ⏳ Update documentation
6. ⏳ Add migration guide

