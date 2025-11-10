# Package Name Options

## Current Name
- `ai-browser-test-core` - Generic, not descriptive, "core" suffix is unnecessary

## Research Findings

### Similar Packages
- `@playwright/test` - Framework name + purpose
- `@public-ui/visual-tests` - Scoped, descriptive
- Visual testing tools: `percy`, `chromatic`, `applitools`

### Naming Patterns
1. **Scoped packages** (`@scope/name`) - Professional, organized
2. **Descriptive names** - Clear purpose
3. **Short but memorable** - Easy to type and remember
4. **Keyword-rich** - Discoverable on npm

## Recommended Options

### Option 1: `@visual-ai/validate` ⭐ (Recommended)
**Pros:**
- ✅ Scoped, professional
- ✅ Clear purpose (visual AI validation)
- ✅ Short and memorable
- ✅ Room for related packages (`@visual-ai/capture`, etc.)
- ✅ Easy to type

**Cons:**
- Requires npm org (free for public)

**Usage:**
```bash
npm install @visual-ai/validate
```

### Option 2: `ai-visual-testing`
**Pros:**
- ✅ Very clear purpose
- ✅ Good for SEO/discovery
- ✅ No scope needed
- ✅ Descriptive

**Cons:**
- ❌ Longer name
- ❌ Generic

**Usage:**
```bash
npm install ai-visual-testing
```

### Option 3: `screenshot-ai`
**Pros:**
- ✅ Short and catchy
- ✅ Clear what it does
- ✅ Easy to remember

**Cons:**
- ❌ Might be too generic
- ❌ Doesn't convey "testing" aspect

**Usage:**
```bash
npm install screenshot-ai
```

### Option 4: `vision-test`
**Pros:**
- ✅ Very short
- ✅ Professional
- ✅ Clear

**Cons:**
- ❌ Might be confused with computer vision libraries
- ❌ Less descriptive

**Usage:**
```bash
npm install vision-test
```

### Option 5: `semantic-screenshot`
**Pros:**
- ✅ Describes the semantic/AI nature
- ✅ Clear purpose
- ✅ Differentiates from pixel-diff tools

**Cons:**
- ❌ Longer
- ❌ "Semantic" might be less understood

**Usage:**
```bash
npm install semantic-screenshot
```

### Option 6: `ai-screenshot-judge`
**Pros:**
- ✅ Very descriptive
- ✅ "Judge" conveys evaluation aspect
- ✅ Clear AI component

**Cons:**
- ❌ Longest option
- ❌ "Judge" might be confusing

**Usage:**
```bash
npm install ai-screenshot-judge
```

## Comparison Matrix

| Name | Length | Clarity | Memorable | Professional | SEO |
|------|--------|---------|-----------|-------------|-----|
| `@visual-ai/validate` | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| `ai-visual-testing` | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| `screenshot-ai` | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| `vision-test` | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| `semantic-screenshot` | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| `ai-screenshot-judge` | ⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

## Recommendation

**Top Choice: `@visual-ai/validate`**

Reasons:
1. **Professional**: Scoped packages look more professional
2. **Scalable**: Can add related packages under `@visual-ai` scope
3. **Clear**: "visual-ai" + "validate" = clear purpose
4. **Short**: Easy to type and remember
5. **Modern**: Follows npm best practices

**Alternative: `ai-visual-testing`** (if scoped packages are not preferred)

## Next Steps

1. Check npm availability for chosen name
2. Update package.json
3. Update all imports in queeraoke
4. Republish to npm
5. Update documentation

