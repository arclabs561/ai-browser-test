# API Coherence and Integration Guide

## Overview

This document outlines the coherent patterns and integration points across the `ai-visual-test` API surface. It ensures consistent usage patterns and clear guidance on when to use which functions.

## Core Principles

### 1. Primary API: `validateScreenshot`

**Always use this as the foundation** for all validation. All convenience functions ultimately call this.

```javascript
import { validateScreenshot } from 'ai-visual-test';

const result = await validateScreenshot(imagePath, prompt, {
  // Core options
  testType: 'general',
  viewport: { width: 1280, height: 720 },
  
  // Enhanced features
  enableUncertaintyReduction: true,
  enableHallucinationCheck: true,
  adaptiveSelfConsistency: true,
  
  // Multi-modal context
  html: renderedCode.html,
  css: renderedCode.criticalCSS,
  renderedCode: renderedCode,
  
  // Goals and temporal context
  goal: goal,
  temporalNotes: aggregatedNotes
});
```

### 2. Convenience Functions: When to Use

**Use convenience functions for common workflows** to reduce boilerplate:

#### `validateWithGoals` - Goals-Based Validation
```javascript
// Use when: You have a specific goal and want simplified API
const result = await validateWithGoals('screenshot.png', {
  goal: 'accessibility', // or object, array, function
  context: {
    testType: 'accessibility-test',
    enableUncertaintyReduction: true
  }
});
```

#### `testGameplay` - Gameplay Testing
```javascript
// Use when: Testing games with variable goals
const result = await testGameplay(page, {
  url: 'https://game.example.com',
  goals: ['fun', 'accessibility'],
  captureTemporal: true,
  captureCode: true
});
```

#### `testBrowserExperience` - Browser Experience Testing
```javascript
// Use when: Testing multi-stage browser experiences
const result = await testBrowserExperience(page, {
  url: 'https://example.com',
  stages: ['initial', 'form', 'payment'],
  captureTemporal: true,
  captureCode: true
});
```

### 3. Persona Experience: `experiencePageAsPersona` vs `experiencePageWithPersonas`

**Use `experiencePageAsPersona` for single persona** (recommended):
```javascript
// Single persona - automatically performs temporal aggregation
const experience = await experiencePageAsPersona(page, persona, {
  url: 'https://example.com',
  captureCode: true,
  captureTemporal: true,
  duration: 5000
});
// Returns: { persona, notes, screenshots, evaluation, aggregated, aggregatedMultiScale }
```

**Use `experiencePageWithPersonas` for multiple personas**:
```javascript
// Multiple personas - returns array of experiences
const experiences = await experiencePageWithPersonas(page, personas, {
  url: 'https://example.com',
  captureCode: true
});
// Returns: PersonaExperienceResult[]
```

**Note**: `experiencePageWithPersonas` internally calls `experiencePageAsPersona` for each persona.

### 4. Consistent Error Handling

**All functions throw `ValidationError` for invalid inputs**:
```javascript
import { ValidationError } from 'ai-visual-test';

try {
  await validateScreenshot('missing.png', 'prompt');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
    console.error('Details:', error.details);
  }
}
```

### 5. Consistent Return Types

**All validation functions return normalized results**:
```javascript
{
  score: number | null,        // Always present, may be null
  issues: string[],            // Always array, may be empty
  uncertainty: number | null,  // 0-1, higher = more uncertain
  confidence: number | null,   // 0-1, higher = more confident
  // ... other fields
}
```

**All experience functions return consistent structures**:
```javascript
{
  persona: Persona,
  notes: TemporalNote[],
  screenshots: TemporalScreenshot[],
  evaluation: ValidationResult | null,
  aggregated: AggregatedNotes | null,      // Always present (may be empty)
  aggregatedMultiScale: MultiScaleNotes | null  // Always present (may be empty)
}
```

## Integration Patterns

### Pattern 1: Basic Validation with Uncertainty Reduction
```javascript
const result = await validateScreenshot('screenshot.png', 'Evaluate this page', {
  enableUncertaintyReduction: true,
  enableHallucinationCheck: true
});
```

### Pattern 2: Goals-Based Validation
```javascript
const result = await validateWithGoals('screenshot.png', {
  goal: 'accessibility',
  context: {
    enableUncertaintyReduction: true
  }
});
```

### Pattern 3: Persona Experience with Temporal Aggregation
```javascript
const experience = await experiencePageAsPersona(page, persona, {
  captureTemporal: true,
  duration: 5000
});

// Use aggregated notes in validation
const validation = await validateScreenshot(
  experience.screenshots[0].path,
  'Evaluate from persona perspective',
  {
    temporalNotes: experience.aggregated,
    goal: persona.goals[0]
  }
);
```

### Pattern 4: Multi-Stage Browser Experience
```javascript
const experience = await testBrowserExperience(page, {
  url: 'https://example.com',
  stages: ['initial', 'form', 'payment'],
  captureTemporal: true
});

// Access aggregated notes across all stages
const overallValidation = await validateScreenshot(
  experience.stages[0].screenshot,
  'Evaluate overall experience',
  {
    temporalNotes: experience.aggregated
  }
);
```

### Pattern 5: Comprehensive Meta Testing
```javascript
// Use ALL APIs together for comprehensive testing
const basic = await validateScreenshot(...);
const persona = await experiencePageAsPersona(...);
const goals = await validateWithGoals(...);
const browser = await testBrowserExperience(...);
```

## Context Propagation

**Context flows through the system consistently**:

1. **Goals** → Passed via `context.goal` → Used by prompt composition system
2. **Temporal Notes** → Passed via `context.temporalNotes` → Included in prompt
3. **Rendered Code** → Passed via `context.renderedCode` → Used for multi-modal validation
4. **Uncertainty Reduction** → Passed via `context.enableUncertaintyReduction` → Applied automatically

## Best Practices

1. **Always use `validateScreenshot` as the foundation** - convenience functions are wrappers
2. **Enable uncertainty reduction** for production use: `enableUncertaintyReduction: true`
3. **Use temporal aggregation** when testing interactive experiences: `captureTemporal: true`
4. **Pass goals in context** rather than manually constructing prompts
5. **Normalize results** using `normalizeValidationResult` if building custom workflows
6. **Use convenience functions** for common patterns to reduce boilerplate
7. **Check return types** - always verify `score`, `issues`, `uncertainty`, `confidence` exist

## Migration Guide

### From `experiencePageWithPersonas` to `experiencePageAsPersona`

**Old pattern**:
```javascript
const experiences = await experiencePageWithPersonas(page, personas, options);
```

**New pattern** (single persona):
```javascript
const experience = await experiencePageAsPersona(page, persona, options);
```

**New pattern** (multiple personas):
```javascript
const experiences = [];
for (const persona of personas) {
  const experience = await experiencePageAsPersona(page, persona, options);
  experiences.push(experience);
}
// Or use convenience: experiencePageWithPersonas still works
```

### From Manual Prompt Construction to Goals

**Old pattern**:
```javascript
const prompt = `Evaluate this game for ${goalType}`;
const result = await validateScreenshot(imagePath, prompt, context);
```

**New pattern**:
```javascript
const result = await validateWithGoals(imagePath, {
  goal: goalType, // Automatically generates appropriate prompt
  context: { ... }
});
```

## Summary

- **Primary API**: `validateScreenshot` - use as foundation
- **Convenience Functions**: Use for common workflows
- **Persona Experience**: `experiencePageAsPersona` for single, `experiencePageWithPersonas` for multiple
- **Error Handling**: All functions throw `ValidationError`
- **Return Types**: Always normalized and consistent
- **Context Propagation**: Goals, temporal notes, rendered code flow through context
- **Best Practices**: Enable uncertainty reduction, use temporal aggregation, pass goals in context

