# Variable Goals/Prompts for Games

## Overview

Games need **variable prompts and goals** - not hardcoded game states. This system allows games to accept flexible, context-aware goals and prompts.

## How Others Do It

### Research Approaches

1. **Goal-Conditioned Policies** (RL Research)
   - Goals specified as conditions
   - Policies adapt to different goals
   - Flexible task specification

2. **Dynamic Objective Functions** (Game AI)
   - Objectives change based on context
   - Multiple objectives evaluated simultaneously
   - Weighted objective combinations

3. **Task-Specific Prompts** (LLM Research)
   - Prompts adapt to task type
   - Context-aware prompt generation
   - Multi-objective evaluation

### Industry Practices

1. **String Prompts** - Simple, flexible, direct
2. **Goal Objects** - Structured, systematic, criteria-based
3. **Goal Arrays** - Multiple goals, comprehensive evaluation
4. **Function Generators** - Dynamic, adaptive, context-aware

## Our Implementation

### Core Function: `generateGamePrompt()`

**Location**: `src/game-goal-prompts.mjs`

**Supports 4 Input Types:**

1. **String Prompt** - Direct prompt with context interpolation
2. **Goal Object** - Structured goal with criteria, focus, questions
3. **Goal Array** - Multiple goals evaluated together
4. **Function** - Dynamic goal generation

### Usage Examples

#### 1. String Prompt (Simple)

```javascript
import { generateGamePrompt } from 'ai-visual-test';

const prompt = generateGamePrompt(
  'Evaluate if the game is fun. Current score: ${gameState.score}, Level: ${gameState.level}',
  {
    gameState: { score: 100, level: 5 }
  }
);
```

**Result**: `"Evaluate if the game is fun. Current score: 100, Level: 5\n\nCURRENT GAME STATE:\n- Score: 100\n- Level: 5"`

#### 2. Goal Object (Structured)

```javascript
import { generateGamePrompt } from 'ai-visual-test';

const goal = {
  description: 'Evaluate game accessibility',
  criteria: [
    'Can be played with keyboard only',
    'Visual indicators are clear',
    'Audio feedback is available',
    'Controls are customizable'
  ],
  focus: ['accessibility', 'keyboard-navigation', 'visual-indicators'],
  questions: [
    'Can someone with motor disabilities play this?',
    'Can someone with visual impairments play this?',
    'Are controls accessible?'
  ],
  minScore: 7 // Expected minimum score
};

const prompt = generateGamePrompt(goal, {
  gameState: { gameActive: true, score: 100 }
});
```

**Result**: Structured prompt with goal description, criteria, focus areas, questions, and game state context.

#### 3. Goal Array (Multiple Goals)

```javascript
import { generateGamePrompt } from 'ai-visual-test';

const goals = [
  'Is the game fun?',
  'Are controls responsive?',
  'Is it accessible?',
  {
    description: 'Evaluate performance',
    criteria: ['60 FPS', 'No lag spikes', 'Responsive input']
  }
];

const prompt = generateGamePrompt(goals, {
  gameState: { gameActive: true, score: 100 }
});
```

**Result**: Prompt evaluating all goals together with game state context.

#### 4. Predefined Goal Templates

```javascript
import { createGameGoal, createGameGoals, generateGamePrompt } from 'ai-visual-test';

// Single goal
const funGoal = createGameGoal('fun');
const prompt1 = generateGamePrompt(funGoal, { gameState });

// Multiple goals
const goals = createGameGoals(['fun', 'accessibility', 'performance']);
const prompt2 = generateGamePrompt(goals, { gameState });
```

**Available Templates:**
- `'fun'` - Fun and engagement
- `'accessibility'` - Accessibility evaluation
- `'performance'` - Performance evaluation
- `'balance'` - Game balance
- `'visuals'` - Visual design
- `'controls'` - Control evaluation

#### 5. Function (Dynamic)

```javascript
import { generateGamePrompt } from 'ai-visual-test';

const dynamicGoal = (context) => {
  const { gameState } = context;
  if (gameState.level > 10) {
    return 'Evaluate late-game balance and difficulty scaling';
  } else if (gameState.score > 1000) {
    return 'Evaluate high-score gameplay experience';
  } else {
    return 'Evaluate early-game tutorial and onboarding';
  }
};

const prompt = generateGamePrompt(dynamicGoal, {
  gameState: { level: 15, score: 500 }
});
```

**Result**: Dynamic prompt based on game state.

#### 6. Integration with `validateScreenshot()`

```javascript
import { validateScreenshot, generateGamePrompt, createGameGoal } from 'ai-visual-test';

// Create goal
const goal = createGameGoal('accessibility', {
  questions: ['Can it be played with keyboard only?']
});

// Generate prompt
const prompt = generateGamePrompt(goal, {
  gameState: { gameActive: true, score: 100 },
  persona: { name: 'Accessibility Advocate' }
});

// Validate with goal-based prompt
const result = await validateScreenshot('gameplay.png', prompt, {
  gameState: { gameActive: true, score: 100 },
  testType: 'gameplay-accessibility'
});
```

#### 7. Integration with `experiencePageAsPersona()`

```javascript
import { experiencePageAsPersona, generateGamePrompt, createGameGoals } from 'ai-visual-test';

// Create multiple goals
const goals = createGameGoals(['fun', 'accessibility', 'performance']);

// Experience page with goals
const experience = await experiencePageAsPersona(page, persona, {
  url: 'https://game.example.com',
  goals: goals.map(g => g.description) // Use goal descriptions as persona goals
});

// Evaluate with goal-based prompts
for (const goal of goals) {
  const prompt = generateGamePrompt(goal, {
    gameState: experience.pageState?.gameState,
    renderedCode: experience.renderedCode,
    persona
  });
  
  const result = await validateScreenshot(
    experience.screenshots[0].path,
    prompt,
    {
      gameState: experience.pageState?.gameState,
      renderedCode: experience.renderedCode
    }
  );
}
```

## Research Integration

### Papers Referenced

1. **Goal-Conditioned RL** - Variable goals in reinforcement learning
2. **Dynamic Objective Functions** - Flexible objectives in game AI
3. **Task-Specific Prompts** - Context-aware prompt generation

### Implementation Notes

- **Flexible Input** - Accepts strings, objects, arrays, functions
- **Context Interpolation** - Variables like `${gameState.score}` are interpolated
- **Backward Compatible** - Legacy focus strings still work
- **Research-Aligned** - Based on goal-conditioned policy research

## Quality Assurance

### Code Quality ✅

- ✅ Type checking and validation
- ✅ Error handling with fallbacks
- ✅ Backward compatibility
- ✅ Comprehensive documentation
- ✅ Module loading verified

### Testing Status

- ✅ Module loads correctly
- ✅ Exports verified
- ⚠️ Unit tests needed
- ⚠️ Integration tests needed
- ⚠️ Real game testing needed

## Best Practices

### For Game Developers

1. **Use Goal Objects** for structured evaluation
2. **Use Goal Arrays** for comprehensive evaluation
3. **Use Predefined Templates** for common goals
4. **Customize Templates** for game-specific needs

### For Test Writers

1. **Define Goals Early** - Know what you're testing
2. **Use Multiple Goals** - Comprehensive evaluation
3. **Include Context** - Game state, persona, rendered code
4. **Validate Results** - Check consistency across goals

## Examples

### Example 1: Simple Fun Evaluation

```javascript
const prompt = generateGamePrompt('Is this game fun?', { gameState });
const result = await validateScreenshot('game.png', prompt);
```

### Example 2: Comprehensive Evaluation

```javascript
const goals = createGameGoals(['fun', 'accessibility', 'performance', 'balance']);
const prompt = generateGamePrompt(goals, { gameState, persona });
const result = await validateScreenshot('game.png', prompt);
```

### Example 3: Custom Goal

```javascript
const customGoal = {
  description: 'Evaluate if the game is engaging for 10+ minutes',
  criteria: [
    'Maintains interest over time',
    'Has variety in gameplay',
    'Provides sense of progression',
    'Has replay value'
  ],
  questions: [
    'Would you play this for 10+ minutes?',
    'Is there enough variety?',
    'Does it feel repetitive?'
  ]
};

const prompt = generateGamePrompt(customGoal, { gameState });
const result = await validateScreenshot('game.png', prompt);
```

### Example 4: Dynamic Goal Based on State

```javascript
const dynamicGoal = (context) => {
  const { gameState } = context;
  if (gameState.score > 1000) {
    return {
      description: 'Evaluate high-score gameplay',
      criteria: ['Challenge level', 'Skill requirement', 'Reward system'],
      focus: ['difficulty', 'skill', 'rewards']
    };
  } else {
    return {
      description: 'Evaluate early-game experience',
      criteria: ['Tutorial quality', 'Onboarding', 'Initial engagement'],
      focus: ['tutorial', 'onboarding', 'engagement']
    };
  }
};

const prompt = generateGamePrompt(dynamicGoal, { gameState: { score: 1500 } });
const result = await validateScreenshot('game.png', prompt);
```

## Conclusion

**Variable goals/prompts for games** are now fully supported:

- ✅ String prompts with context interpolation
- ✅ Structured goal objects
- ✅ Multiple goals (arrays)
- ✅ Dynamic goal generation (functions)
- ✅ Predefined goal templates
- ✅ Backward compatible with legacy code
- ✅ Research-aligned implementation

**Status**: Ready for use, needs testing with real games.

