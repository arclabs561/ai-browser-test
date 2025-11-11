# Publishing Instructions

## Current Status

✅ **All improvements implemented and tested:**
- Position counter-balancing
- Dynamic few-shot examples  
- Spearman correlation metrics
- All 240 tests passing

✅ **Version**: 0.3.1 ready to publish

## Publishing with MFA

npm requires a one-time password (OTP) for publishing. You have 1Password installed, so you can get the OTP:

### Option 1: 1Password CLI (if configured)
```bash
# Get OTP from 1Password
op item get "npm" --otp

# Then publish with OTP
npm publish --access public --otp=<OTP_CODE>
```

### Option 2: 1Password App
1. Open 1Password app
2. Search for "npm" or your npm account
3. Copy the 6-digit OTP code
4. Run: `npm publish --access public --otp=<OTP_CODE>`

### Option 3: Manual TOTP App
If you have the TOTP secret in another app (Authy, Google Authenticator, etc.), use that code.

## Alternative: Use GitHub Actions Workflow

The workflow is configured for OIDC trusted publishing (no MFA needed):

1. **Configure OIDC on npmjs.com** (one-time setup):
   - Go to: https://www.npmjs.com/settings/arclabs561/access-tokens
   - Click "Trusted Publishers" → "Add Trusted Publisher"
   - Select "GitHub Actions"
   - Enter:
     - GitHub User: `arclabs561`
     - Repository: `arclabs561/ai-browser-test`
     - Workflow file: `.github/workflows/publish.yml`
   - Click "Add"

2. **Trigger workflow**:
   ```bash
   git add -A
   git commit -m "feat: add position counter-balancing, dynamic few-shot, and metrics"
   git push origin main
   
   # Then trigger workflow via GitHub UI or:
   gh workflow run publish.yml -f version=patch
   ```

## What's New in 0.3.1

### Position Counter-Balancing
- Eliminates position bias by running evaluations twice
- Automatic averaging of scores
- Position bias detection

### Dynamic Few-Shot Examples
- Semantic similarity matching (ES-KNN-style)
- Keyword-based selection
- Automatic example formatting

### Comprehensive Metrics
- Spearman's rank correlation (ρ)
- Pearson's correlation (r)
- Kendall's tau (τ)
- Rank agreement calculations

## Verification

After publishing, verify:
```bash
npm view ai-browser-test version  # Should show 0.3.1
npm view ai-browser-test time.modified  # Should show recent timestamp
```

