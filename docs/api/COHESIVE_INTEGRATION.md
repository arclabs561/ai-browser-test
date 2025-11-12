# Cohesive Integration: Variable Goals Throughout the System

## Overview

Variable goals are now **cohesively integrated** throughout the entire system. Goals can be passed in context and are automatically used by the prompt composition system, making the API more intuitive and consistent.

## Integration Points

### 1. `validateScreenshot()` - Direct Goal Support

**Before** (manual prompt generation):
```javascript
const goal = createGameGoal('accessibility');
const prompt = generateGamePrompt(goal, { gameState });
const result = await validateScreenshot('screenshot.png', prompt, { gameState });
```

**After** (cohesive integration):
```javascript
const goal = createGameGoal('accessibility');
// Goal passed in context - prompt composition handles it automatically
const result = await validateScreenshot('screenshot.png', 'Base prompt', {
  goal, // Automatically used by prompt composition
  gameState
});
```

**Benefits:**
- ✅ Less boilerplate
- ✅ Consistent with other context properties
- ✅ Works with prompt composition system
- ✅ Backward compatible (still accepts prompt string)

### 2. Prompt Composition System - Goal Awareness

The prompt composition system (`composeSingleImagePrompt`, `composeComparisonPrompt`, `composeMultiModalPrompt`) now automatically detects and uses goals from context:

```javascript
import { composeSingleImagePrompt } from 'ai-visual-test';

const prompt = await composeSingleImagePrompt('Base prompt', {
  goal: 'Is it fun?', // Automatically used
  gameState: { score: 100 },
  renderedCode: renderedCode
});
```

**How it works:**
1. Checks for `context.goal` or `options.goal`
2. If present, generates prompt from goal using `generateGamePrompt()`
3. Uses generated prompt as base for composition
4. Falls back to base prompt if goal generation fails

### 3. `validateWithGoals()` - Convenience Function

The convenience function now passes goals through to the underlying system:

```javascript
import { validateWithGoals, createGameGoal } from 'ai-visual-test';

const goal = createGameGoal('accessibility');
const result = await validateWithGoals('screenshot.png', {
  goal, // Passed through to validateScreenshot
  gameState: { score: 100 }
});
```

**Flow:**
1. `validateWithGoals()` receives goal
2. Generates prompt (for display/debugging)
3. Passes goal in context to `validateScreenshot()`
4. `validateScreenshot()` uses prompt composition
5. Prompt composition detects goal and uses it

### 4. `testGameplay()` - High-Level Integration

The high-level convenience function integrates goals throughout the workflow:

```javascript
import { testGameplay, createGameGoals } from 'ai-visual-test';

const goals = createGameGoals(['fun', 'accessibility', 'performance']);
const result = await testGameplay(page, {
  url: 'https://game.example.com',
  goals, // Used for evaluation
  personas: [/* ... */]
});
```

**Flow:**
1. `testGameplay()` receives goals
2. For each goal, generates prompt
3. Passes goal in context to `validateScreenshot()`
4. Prompt composition uses goal automatically
5. Results include goal information

### 5. `multiPerspectiveEvaluation()` - Persona Goals

Personas can now have goals that are automatically used:

```javascript
const personas = [
  {
    name: 'Accessibility Advocate',
    perspective: '...',
    focus: ['accessibility'],
    goal: createGameGoal('accessibility') // NEW: Goal support
  }
];

const results = await multiPerspectiveEvaluation(
  validateScreenshot,
  screenshotPath,
  renderedCode,
  gameState,
  personas
);
```

**Flow:**
1. Persona has `goal` property
2. `multiPerspectiveEvaluation()` passes goal in context
3. `validateScreenshot()` uses prompt composition
4. Prompt composition detects and uses goal

## Cohesive Design Principles

### 1. Context-Based Integration

Goals are passed through context, not as separate parameters:

```javascript
// ✅ Cohesive - goal in context
await validateScreenshot(path, prompt, { goal, gameState });

// ❌ Not cohesive - goal as separate parameter
await validateScreenshot(path, prompt, gameState, goal);
```

### 2. Automatic Detection

The system automatically detects goals in context:

```javascript
// Prompt composition automatically checks for context.goal
const prompt = await composeSingleImagePrompt(basePrompt, {
  goal: 'Is it fun?', // Automatically detected and used
  gameState: { score: 100 }
});
```

### 3. Graceful Fallback

If goal generation fails, the system falls back gracefully:

```javascript
// If goal generation fails, uses base prompt
const prompt = await composeSingleImagePrompt('Base prompt', {
  goal: invalidGoal // Falls back to 'Base prompt'
});
```

### 4. Backward Compatibility

All existing code continues to work:

```javascript
// Still works - goal is optional
await validateScreenshot(path, 'Manual prompt', { gameState });

// New way - goal in context
await validateScreenshot(path, 'Base prompt', { goal, gameState });
```

## Usage Patterns

### Pattern 1: Simple Goal String

```javascript
const result = await validateScreenshot('screenshot.png', 'Base prompt', {
  goal: 'Is the game fun?',
  gameState: { score: 100 }
});
```

### Pattern 2: Goal Object

```javascript
const goal = createGameGoal('accessibility');
const result = await validateScreenshot('screenshot.png', 'Base prompt', {
  goal,
  gameState: { gameActive: true }
});
```

### Pattern 3: Multiple Goals (Array)

```javascript
const goals = ['fun', 'accessibility', 'performance'];
// For each goal, validate separately
for (const goal of goals) {
  const result = await validateScreenshot('screenshot.png', 'Base prompt', {
    goal,
    gameState: { score: 100 }
  });
}
```

### Pattern 4: Dynamic Goal (Function)

```javascript
const dynamicGoal = (context) => {
  if (context.gameState.score > 1000) {
    return 'Evaluate high-score gameplay';
  }
  return 'Evaluate early-game experience';
};

const result = await validateScreenshot('screenshot.png', 'Base prompt', {
  goal: dynamicGoal,
  gameState: { score: 1500 }
});
```

### Pattern 5: Convenience Function

```javascript
// Simplest way - convenience function handles everything
const result = await validateWithGoals('screenshot.png', {
  goal: createGameGoal('fun'),
  gameState: { score: 200 }
});
```

## Implementation Details

### Prompt Composition Flow

```
validateScreenshot(path, prompt, { goal, ...context })
  ↓
VLLMJudge.buildPrompt(prompt, context)
  ↓
composeSingleImagePrompt(prompt, context)
  ↓
composePrompt(prompt, { goal, ...options })
  ↓
if (goal) {
  generateGamePrompt(goal, context) → basePrompt
}
  ↓
Compose with rubric, temporal notes, persona, etc.
  ↓
Final prompt
```

### Goal Detection

The system checks for goals in multiple places:

1. `context.goal` - Direct goal in validation context
2. `options.goal` - Goal in prompt composition options
3. `persona.goal` - Goal in persona configuration

### Error Handling

- If goal generation fails → falls back to base prompt
- If goal module not available → falls back to base prompt
- All errors are logged but don't break the flow

## Benefits

### 1. Less Boilerplate

**Before:**
```javascript
const goal = createGameGoal('accessibility');
const prompt = generateGamePrompt(goal, { gameState });
const result = await validateScreenshot(path, prompt, { gameState });
```

**After:**
```javascript
const goal = createGameGoal('accessibility');
const result = await validateScreenshot(path, 'Base prompt', { goal, gameState });
```

### 2. Consistent API

Goals work the same way everywhere:
- `validateScreenshot()` - goal in context
- `composeSingleImagePrompt()` - goal in context
- `validateWithGoals()` - goal in options
- `testGameplay()` - goals in options

### 3. Automatic Integration

No need to manually generate prompts - the system handles it:
- Prompt composition detects goals
- Automatically generates prompts
- Integrates with rubrics, temporal notes, personas

### 4. Backward Compatible

All existing code continues to work:
- Manual prompts still work
- Goals are optional
- No breaking changes

## Testing

All integration points are tested:

- ✅ `validateScreenshot()` with goals in context
- ✅ Prompt composition with goals
- ✅ Convenience functions with goals
- ✅ End-to-end workflows
- ✅ Error handling and fallbacks

## Conclusion

Variable goals are now **cohesively integrated** throughout the system:

- ✅ Goals work everywhere
- ✅ Consistent API patterns
- ✅ Automatic prompt generation
- ✅ Graceful fallbacks
- ✅ Backward compatible
- ✅ Well tested

The system is more cohesive, easier to use, and better aligned with research on goal-conditioned systems.

