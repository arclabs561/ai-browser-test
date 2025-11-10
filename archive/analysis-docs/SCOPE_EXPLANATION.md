# npm Scoped Packages: What Does the Slash Mean?

## Understanding `@scope/package-name`

The slash in `@visual-ai/validate` separates the **scope** from the **package name**.

### What is a Scope?

A scope is a **namespace** that you must own. It can be:

1. **Your npm username** (free, automatic)
   - Example: `@arc561/validate` (if your username is `arc561`)
   - You automatically own `@arc561` scope

2. **An npm organization** (requires creating an org)
   - Example: `@visual-ai/validate` (requires creating "visual-ai" org)
   - **Free for public packages**
   - **Paid for private packages** ($7/month per user)

3. **Just a namespace** (but you still need to own it)
   - You can't just use any scope - you must own it
   - Either via username or organization

## For `@visual-ai/validate`

To use this name, you would need to:

1. **Create an npm organization** called "visual-ai"
   - Go to npmjs.com → Create Organization
   - Name it "visual-ai"
   - **Free** if publishing public packages
   - **Paid** if you want private packages

2. **Or use your username scope**
   - `@arc561/validate` (if your username is `arc561`)
   - No setup needed - you already own it

## Comparison

| Scope Type | Example | Setup Required | Cost |
|------------|---------|----------------|------|
| Username | `@arc561/validate` | None (automatic) | Free |
| Organization | `@visual-ai/validate` | Create org | Free (public) / $7/mo (private) |
| Unscoped | `ai-visual-testing` | None | Free |

## Recommendation

### Option 1: Use Your Username Scope
```bash
@arc561/validate
```
- ✅ No setup needed
- ✅ Free
- ✅ You already own it
- ❌ Less "branded" (tied to your username)

### Option 2: Create Organization
```bash
@visual-ai/validate
```
- ✅ Professional, branded name
- ✅ Free for public packages
- ✅ Can add team members later
- ❌ Requires creating org (5 minutes)

### Option 3: Unscoped (Simplest)
```bash
ai-visual-testing
```
- ✅ No setup needed
- ✅ Free
- ✅ Simple
- ❌ Less organized (no namespace grouping)

## My Recommendation

**If you want a professional, branded name:**
- Create npm org "visual-ai" (free, takes 2 minutes)
- Use `@visual-ai/validate`

**If you want simplicity:**
- Use `ai-visual-testing` (unscoped, no setup)

**If you want to use your existing scope:**
- Use `@arc561/validate` (no setup, but tied to username)

## Next Steps

If you choose `@visual-ai/validate`:
1. Go to npmjs.com
2. Click "Create Organization"
3. Name it "visual-ai"
4. Publish with `npm publish --access public`

If you choose `ai-visual-testing`:
1. Just update package.json
2. Publish with `npm publish --access public`

