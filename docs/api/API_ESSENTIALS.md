# API Essentials: What You Need to Know

## Quick Start

### Basic Validation
```javascript
import { validateScreenshot } from 'ai-visual-test';

const result = await validateScreenshot('screenshot.png', 'Evaluate this page');
// result.score: 0-10
// result.issues: Array of issues
// result.uncertainty: 0-1 (confidence in judgment)
// result.confidence: 0-1 (how confident we are)
```

### With Goals (Recommended)
```javascript
import { validateScreenshot, createGameGoal } from 'ai-visual-test';

const goal = createGameGoal('accessibility');
const result = await validateScreenshot('screenshot.png', 'Evaluate', {
  goal: goal // Automatically enhances prompt
});
```

### High-Level Convenience Functions
```javascript
import { testGameplay, testBrowserExperience, validateWithGoals } from 'ai-visual-test';

// Gameplay testing
const gameplay = await testGameplay(page, {
  url: 'https://game.example.com',
  goals: ['fun', 'accessibility', 'performance']
});

// Browser experience
const experience = await testBrowserExperience(page, {
  url: 'https://example.com',
  stages: ['initial', 'form', 'payment']
});

// Validation with goals
const validation = await validateWithGoals('screenshot.png', {
  goal: 'accessibility',
  gameState: { score: 100 }
});
```

## Error Handling

All functions throw `ValidationError` for invalid inputs:
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

## Return Types

### ValidationResult
```typescript
{
  score: number | null;        // 0-10, property always exists but value may be null
  issues: Array<Issue>;        // Property always exists, array may be empty
  reasoning: string;           // Always present with a value
  assessment: string | null;   // Property always exists but value may be null
  uncertainty: number | null;  // 0-1, property always exists if uncertainty reduction enabled, value may be null
  confidence: number | null;   // 0-1, property always exists if uncertainty reduction enabled, value may be null
  // ... other fields
}
```

### Issue Object
```typescript
{
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  annoyance: 'very-high' | 'high' | 'medium' | 'low';
  impact: 'blocks-use' | 'degrades-experience' | 'minor-inconvenience' | 'cosmetic';
  evidence?: string;
  suggestion?: string;
}
```

## Goals

Goals can be strings, objects, arrays, or functions. The prompt composition system automatically handles each type.

### String Goals
Simple goal names that map to predefined templates:
```javascript
const result = await validateScreenshot(path, 'prompt', { goal: 'accessibility' });
// Uses predefined accessibility evaluation template
```

### Object Goals
Custom goals with description and criteria:
```javascript
const result = await validateScreenshot(path, 'prompt', {
  goal: {
    description: 'Evaluate accessibility',
    criteria: ['WCAG compliance', 'keyboard navigation']
  }
});
// Uses custom description and criteria to generate prompt
```

### Array Goals
Multiple goals combined:
```javascript
const result = await validateScreenshot(path, 'prompt', {
  goal: ['accessibility', 'performance']
});
// Combines multiple goal templates into single evaluation
```

### Function Goals
Dynamic goals based on context:
```javascript
const result = await validateScreenshot(path, 'prompt', {
  goal: (context) => {
    // Context includes: gameState, renderedCode, persona, testType, etc.
    if (context.gameState?.level > 5) {
      return 'advanced'; // Use advanced evaluation template
    }
    return 'basic'; // Use basic evaluation template
  }
});
// Function is called with context object, should return string or object goal
```

**Note**: Function goals receive a context object with `gameState`, `renderedCode`, `persona`, `testType`, and other validation context. The function should return a string (goal name) or object (custom goal).

## Uncertainty Reduction

Enabled by default. Provides confidence estimates:
```javascript
const result = await validateScreenshot('screenshot.png', 'prompt', {
  enableUncertaintyReduction: true, // Default
  enableHallucinationCheck: true    // Default
});

// result.uncertainty: 0-1 (higher = more uncertain)
// result.confidence: 0-1 (higher = more confident)
```

## Temporal Aggregation

Automatically included in convenience functions:
```javascript
const gameplay = await testGameplay(page, { url: '...' });
// gameplay.aggregated: Temporal aggregation
// gameplay.aggregatedMultiScale: Multi-scale aggregation
```

## Best Practices

1. **Use goals** - They automatically enhance prompts
2. **Check uncertainty** - Request human validation if uncertainty > 0.3
3. **Use convenience functions** - Less boilerplate
4. **Handle errors** - Catch `ValidationError` for invalid inputs
5. **Check return structure** - Always verify `score` and `issues` are present

## Common Patterns

### Queeraoke Pattern
```javascript
import { testGameplay, validateWithGoals } from 'ai-visual-test';

const gameplay = await testGameplay(page, {
  url: 'https://game.example.com',
  goals: ['fun', 'accessibility']
});

// Validate with temporal context
const validation = await validateWithGoals(
  gameplay.experiences[0].screenshots[0].path,
  {
    goal: 'accessibility',
    context: {
      temporalNotes: gameplay.aggregated
    }
  }
);
```

### Multi-Perspective
```javascript
import { experiencePageWithPersonas, validateScreenshot } from 'ai-visual-test';

const experiences = await experiencePageWithPersonas(page, [
  { name: 'Gamer', goals: ['fun'] },
  { name: 'Accessibility', goals: ['accessibility'] }
]);

// Each experience has aggregated temporal notes
experiences.forEach(exp => {
  console.log(exp.aggregated.coherence);
});
```

## Configuration

API keys loaded automatically from `.env`:
```bash
GEMINI_API_KEY=your-key
OPENAI_API_KEY=your-key
CLAUDE_API_KEY=your-key
```

Or set programmatically:
```javascript
import { setConfig } from 'ai-visual-test';

setConfig({
  provider: 'gemini',
  apiKey: 'your-key'
});
```

