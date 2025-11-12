# NPM Trusted Publisher Update Guide

## Overview

After renaming the package from `ai-browser-test` to `ai-visual-test` and renaming the GitHub repository, you need to update the npm trusted publisher configuration.

## Steps to Update Trusted Publisher

### 1. Go to npm Trusted Publishers Settings

Visit: https://www.npmjs.com/settings/arclabs561/access-tokens

### 2. Remove Old Trusted Publisher (if exists)

If there's a trusted publisher for `ai-browser-test`:
1. Find the entry for `arclabs561/ai-browser-test`
2. Click "Remove" or "Delete"

### 3. Add New Trusted Publisher

1. Click "Add Trusted Publisher" or "New Trusted Publisher"
2. Fill in the details:
   - **Organization/User**: `arclabs561`
   - **Repository**: `ai-visual-test` (NEW - updated from ai-browser-test)
   - **Workflow**: `publish.yml` (same as before)
3. Click "Save" or "Add"

### 4. Verify Configuration

The trusted publisher should show:
- Repository: `arclabs561/ai-visual-test`
- Workflow: `publish.yml`
- Status: Active

## Verification

After the next publish, verify it worked:

```bash
npm view ai-visual-test --json | jq '.dist.publisher'
# Expected: "GitHub Actions <npm-oidc-no-reply@github.com>"
```

## Current Status

- ✅ GitHub repository renamed: `ai-visual-test`
- ✅ Package name updated: `ai-visual-test@0.4.0`
- ✅ Tag created: `v0.4.0`
- ⚠️ **Action Required**: Update npm trusted publisher to point to new repo name

## Workflow Configuration

The `.github/workflows/publish.yml` is already configured correctly:
- ✅ `permissions.id-token: write` - Required for OIDC
- ✅ `registry-url: 'https://registry.npmjs.org'` - Correct registry
- ✅ Triggers on tags `v*` - Will trigger on `v0.4.0`

Once the trusted publisher is updated on npmjs.com, the workflow will automatically publish the package.

