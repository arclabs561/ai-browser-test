# Publish Checklist

## Current Status

### Package Names
- ✅ **ai-visual-test** - New package name (correct)
- ⚠️ **ai-browser-test** - Old package (needs deprecation)

### Repository
- ✅ Repository: `arclabs561/ai-visual-test` (correct)
- ⚠️ Old package `ai-browser-test` points to correct repo but wrong name

### NPM Status
- ❌ `ai-visual-test` - Not published yet (404)
- ✅ `ai-browser-test` - Published (0.3.1, 3 days ago)

## Actions Needed

### 1. Deprecate Old Package
```bash
npm run deprecate:old
# Or manually:
npm deprecate ai-browser-test "This package has been renamed to ai-visual-test. Please use 'npm install ai-visual-test' instead."
```

### 2. Publish New Package
```bash
# Tag version
git tag v0.5.0
git push origin v0.5.0

# Or trigger publish workflow via GitHub Actions
# The publish.yml workflow will run on tag push
```

### 3. Verify
- [ ] Old package shows deprecation warning
- [ ] New package is published
- [ ] Repository links are correct
- [ ] README displays correctly on npm

## Package Settings (from npm)

The old `ai-browser-test` package shows:
- ✅ Repository: `arclabs561/ai-visual-test` (correct)
- ✅ Trusted Publisher: Configured (OIDC)
- ⚠️ Package name: `ai-browser-test` (wrong - should be deprecated)

This is expected - the old package exists and needs deprecation.

