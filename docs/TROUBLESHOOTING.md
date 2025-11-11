# Troubleshooting Guide

## Common Issues

### API Key Not Found

**Error**: `ConfigError: No API key found for provider`

**Solutions**:
1. Check `.env` file exists and contains API key
2. Verify environment variable name matches provider:
   - `GEMINI_API_KEY` for Gemini
   - `OPENAI_API_KEY` for OpenAI
   - `ANTHROPIC_API_KEY` for Claude
3. Ensure `.env` file is in project root or use `loadEnv()` explicitly
4. Check API key is not empty or commented out

### Provider Not Available

**Error**: `ProviderError: Provider 'xyz' is not available`

**Solutions**:
1. Check provider name is correct: `'gemini'`, `'openai'`, or `'claude'`
2. Verify API key for that provider is set
3. Check provider is supported (see `src/config.mjs`)

### Cache Issues

**Error**: Cache not working or stale results

**Solutions**:
1. Clear cache: `clearCache()`
2. Check cache directory permissions
3. Verify `cacheEnabled: true` in config
4. Check cache TTL settings

### Timeout Errors

**Error**: `TimeoutError: Request timed out`

**Solutions**:
1. Increase timeout in config: `{ timeout: 60000 }`
2. Check network connectivity
3. Verify API endpoint is accessible
4. Consider using a different provider

### Import Errors

**Error**: `Cannot find module 'ai-browser-test'`

**Solutions**:
1. Install package: `npm install ai-browser-test`
2. For local dev: `npm link ai-browser-test`
3. Check `package.json` includes the dependency
4. Verify Node.js version >= 18.0.0

### Playwright Errors

**Error**: `ValidationError: Page object is required`

**Solutions**:
1. Ensure `@playwright/test` is installed
2. Pass valid Playwright `Page` object
3. Check page is loaded: `await page.goto(url)`
4. Verify page is not closed

### Cost Concerns

**Issue**: API costs too high

**Solutions**:
1. Enable caching: `useCache: true` (default)
2. Use cheaper provider (Gemini has free tier)
3. Reduce batch sizes
4. Use `BatchOptimizer` to minimize requests
5. Check cache hit rate: `getCacheStats()`

## Debug Mode

Enable verbose logging:

```javascript
import { enableDebug } from 'ai-browser-test';

enableDebug();
// Now all operations log detailed information
```

## Getting Help

1. Check [README.md](../README.md) for usage examples
2. Review [example.test.mjs](../example.test.mjs)
3. Check GitHub issues: https://github.com/arclabs561/ai-browser-test/issues
4. Review error messages - they include helpful context

## Performance Tips

1. **Use caching**: Always enable cache for repeated validations
2. **Batch requests**: Use `BatchOptimizer` for multiple screenshots
3. **Choose provider wisely**: Gemini is cheapest, Claude is most accurate
4. **Reduce image size**: Smaller screenshots = faster + cheaper
5. **Use appropriate test types**: Specific test types get better prompts

