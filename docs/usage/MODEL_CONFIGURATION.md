# Model Configuration Guide

## Overview

The system supports multiple Vision Language Models (VLLMs) with different quality/performance trade-offs. You can configure which model to use based on your needs.

## Default Models (Latest - January 2025)

The system now uses the absolute latest models released in 2025:

- **Gemini**: `gemini-2.5-pro` - Released June 2025, top vision-language model, 1M+ context, native thinking
- **OpenAI**: `gpt-5` - Released August 2025, state-of-the-art multimodal, unified reasoning
- **Claude**: `claude-sonnet-4-5` - Released September 2025, enhanced vision capabilities, latest flagship

## Model Tiers

Each provider offers different model tiers:

### Gemini
- **fast**: `gemini-2.0-flash-exp` - Fast, outperforms 1.5 Pro (2x speed)
- **balanced**: `gemini-2.5-pro` - Best balance (released June 2025, top vision model) (default)
- **best**: `gemini-2.5-pro` - Best quality (1M+ context, native thinking, #1 on benchmarks)

### OpenAI
- **fast**: `gpt-4o-mini` - Fast, cheaper
- **balanced**: `gpt-5` - Best balance (released August 2025, unified reasoning) (default)
- **best**: `gpt-5` - Best quality (state-of-the-art multimodal, August 2025)

### Claude
- **fast**: `claude-3-5-haiku-20241022` - Fast, cheaper
- **balanced**: `claude-sonnet-4-5` - Best balance (released September 2025, enhanced vision) (default)
- **best**: `claude-sonnet-4-5` - Best quality (latest flagship, September 2025)

## Configuration Methods

### 1. Environment Variables

```bash
# Set model tier (fast, balanced, best)
export VLM_MODEL_TIER=balanced

# Or set explicit model
export VLM_MODEL=gpt-4o

# Set provider
export VLM_PROVIDER=openai
export OPENAI_API_KEY=your-key
```

### 2. Code Configuration

```javascript
import { validateScreenshot } from 'ai-visual-test';

// Use balanced tier
const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate this page',
  {
    modelTier: 'balanced' // or 'fast', 'best'
  }
);

// Or use explicit model
const result = await validateScreenshot(
  'screenshot.png',
  'Evaluate this page',
  {
    model: 'gpt-4o' // explicit model name
  }
);
```

### 3. Judge Configuration

```javascript
import { VLLMJudge } from 'ai-visual-test';

const judge = new VLLMJudge({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  modelTier: 'best', // Use best model
  verbose: true
});

const result = await judge.judgeScreenshot(
  'screenshot.png',
  'Evaluate this page'
);
```

## Model Comparison

### Quality vs Speed

| Model | Quality | Speed | Cost | Best For | Release Date |
|-------|---------|-------|------|----------|--------------|
| `gpt-4o-mini` | Good | Very Fast | Low | Quick iterations | 2024 |
| `gpt-5` | Best | Fast | Medium | Production (default) - Latest August 2025 | Aug 2025 |
| `claude-3-5-haiku` | Good | Very Fast | Low | Quick iterations | 2024 |
| `claude-sonnet-4-5` | Best | Fast | Medium | Production (default) - Latest September 2025 | Sep 2025 |
| `gemini-2.0-flash-exp` | Excellent | Very Fast | Low | Fast iterations | 2024 |
| `gemini-2.5-pro` | Best | Medium | Medium | Production (default) - Latest June 2025, #1 benchmarks | Jun 2025 |

### Recommendations

**For Development/Testing:**
- Use `fast` tier or `gpt-4o-mini` / `claude-3-5-haiku` / `gemini-2.0-flash-exp`
- Faster feedback loops, lower cost

**For Production:**
- Use `balanced` tier (default) or `gpt-4o` / `claude-3-5-sonnet` / `gemini-1.5-pro`
- Best balance of quality and cost

**For Critical Evaluations:**
- Use `best` tier or `gpt-4-turbo` / `claude-3-5-sonnet` / `gemini-1.5-pro`
- Highest quality, may be slower

## Human Validation Integration

When using human validation, better models improve:
- **Alignment**: Better models align better with human judgment
- **Calibration**: More accurate scores reduce calibration needs
- **Reasoning**: Better explanations help humans understand VLLM decisions

**Recommendation**: Use `balanced` or `best` tier for human validation workflows.

## Cost Considerations

Better models cost more but provide:
- More accurate scores
- Better reasoning
- Fewer disagreements with humans
- Less need for calibration

**Cost per 1M tokens (approximate):**

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| OpenAI | gpt-4o-mini | $0.60 | $2.40 |
| OpenAI | gpt-4o | $2.50 | $10.00 |
| OpenAI | gpt-4-turbo | $10.00 | $30.00 |
| Claude | haiku | $1.00 | $5.00 |
| Claude | sonnet | $3.00 | $15.00 |
| Gemini | flash | $0.30 | $2.50 |
| Gemini | pro | $1.25 | $5.00 |

## Examples

### Quick Development

```bash
export VLM_MODEL_TIER=fast
export VLM_PROVIDER=gemini
export GEMINI_API_KEY=your-key
```

### Production with Best Quality

```bash
export VLM_MODEL_TIER=best
export VLM_PROVIDER=openai
export OPENAI_API_KEY=your-key
```

### Explicit Model Selection

```bash
export VLM_MODEL=gpt-4o
export OPENAI_API_KEY=your-key
```

## Migration from Old Models

If you were using the old default models, the system automatically uses better models now. No code changes needed!

Old defaults → New defaults:
- `gemini-2.5-flash` → `gemini-2.0-flash-exp`
- `gpt-4o-mini` → `gpt-4o`
- `claude-3-5-haiku` → `claude-3-5-sonnet`

To keep using the old models, set:
```bash
export VLM_MODEL=gemini-2.5-flash  # or gpt-4o-mini, claude-3-5-haiku-20241022
```

