# Publishing with Passkey Authentication

Since npm doesn't directly support passkey authentication for `npm publish`, here are your options:

## Option 1: GitHub Actions with OIDC (Recommended - No Manual Auth)

The workflow is already configured for OIDC trusted publishing. This uses your GitHub identity and doesn't require any manual authentication.

### Steps:

1. **Commit all changes:**
   ```bash
   git add -A
   git commit -m "feat: add position counter-balancing, dynamic few-shot, and metrics (v0.3.1)"
   git push origin main
   ```

2. **Create and push a tag:**
   ```bash
   git tag v0.3.1
   git push origin v0.3.1
   ```

3. **GitHub Actions will automatically:**
   - Run tests
   - Publish to npm using OIDC (no OTP needed)
   - Generate provenance attestations

### First-Time Setup (One-Time):

If you haven't configured OIDC on npmjs.com yet:

1. Go to: https://www.npmjs.com/settings/arclabs561/access-tokens
2. Click "Trusted Publishers" → "Add Trusted Publisher"
3. Select "GitHub Actions"
4. Enter:
   - **Organization or user**: `arclabs561`
   - **Repository**: `ai-browser-test`
   - **Workflow filename**: `publish.yml`
5. Click "Add"

After this one-time setup, all future publishes via GitHub Actions will work automatically without any manual authentication.

## Option 2: Create an Automation Token

Automation tokens bypass OTP requirements. You can create one:

1. Go to: https://www.npmjs.com/settings/arclabs561/access-tokens
2. Click "Generate New Token" → "Automation"
3. Name it (e.g., "ai-browser-test-publish")
4. Copy the token
5. Use it:
   ```bash
   npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN
   npm publish --access public
   ```

## Option 3: Browser-Based Login (Still Requires OTP)

If you want to use your passkey for login (but still need OTP for publish):

```bash
npm login --auth-type=web
# Opens browser where you can use passkey
# Then publish (will still prompt for OTP)
npm publish --access public --otp=<OTP>
```

## Recommendation

**Use Option 1 (GitHub Actions)** - It's the most secure, requires no manual steps after initial setup, and automatically generates provenance attestations.

