# Hooks Wisdom Improvements

Based on MCP research (Perplexity, Context7) and industry best practices.

## Research Findings

### Best Practices from Research

1. **Centralize and share hooks** - Version control hooks, document them
2. **Provide clear, actionable error messages** - Guide developers to fix issues
3. **Use LLM for intelligent validation** - Beyond regex, context-aware
4. **Automate hook installation** - Make setup easy for contributors
5. **Regular documentation audits** - Quarterly reviews for bloat
6. **Graceful error handling** - Don't just reject, educate
7. **Validate repository state** - Check files are staged before validation

## Current State Analysis

### ✅ What We're Doing Well

1. **Bespoke hooks per project** - Each has appropriate checks
2. **LLM integration** - Already using LLM for commit message and docs bloat
3. **Blocking behavior** - exit 1 on failures
4. **Clear error messages** - Good examples and guidance

### 💡 Improvements to Inject

1. **Enhanced LLM Prompts** - More context, better rubrics
2. **Smarter Documentation Bloat Detection** - Link analysis, usage tracking
3. **Better Commit Message Guidance** - Context-aware suggestions
4. **Repository State Validation** - Check staged files before processing
5. **Educational Feedback** - Not just blocking, but teaching

## Recommended Improvements

### 1. Enhanced Commit Message Validation

**Current**: Basic LLM analysis
**Improvement**: Add more context and better rubrics

```javascript
// Enhanced prompt with:
// - Staged file context
// - Recent commit history
// - Branch context
// - Project-specific conventions
```

### 2. Smarter Documentation Bloat Detection

**Current**: Pattern matching + LLM
**Improvement**: 
- Check if files are linked/referenced
- Track file access/usage
- Consider file relationships
- Better archive pattern learning

### 3. Repository State Validation

**Current**: Assumes files are staged
**Improvement**: Validate git state before processing

### 4. Educational Feedback

**Current**: Error messages with examples
**Improvement**: 
- Suggest fixes automatically
- Link to documentation
- Show similar good examples
- Progressive disclosure (simple → detailed)

### 5. Context-Aware Validation

**Current**: Basic file type detection
**Improvement**:
- Understand file relationships
- Consider project structure
- Respect .gitignore patterns
- Understand package boundaries

