# Deployment Guide

## For Deployed Sites (Vercel, etc.)

The `@queeraoke/vllm-testing` package is currently installed as a **local file dependency** (`file:../vllm-testing`). This works locally but needs special handling for deployment.

## Option 1: Include Package in Repository (Recommended)

**Best for:** Single repository, simple deployment

1. **Move package into repository:**
   ```bash
   cd /Users/arc/Documents/dev/queeraoke
   mv ../vllm-testing packages/vllm-testing
   ```

2. **Update package.json:**
   ```json
   {
     "dependencies": {
       "@queeraoke/vllm-testing": "file:./packages/vllm-testing"
     }
   }
   ```

3. **Commit package to git:**
   ```bash
   git add packages/vllm-testing
   git commit -m "Add vllm-testing package"
   ```

**Pros:**
- ✅ Works automatically in CI/CD
- ✅ No additional setup needed
- ✅ Version controlled with main repo

**Cons:**
- Package is tied to this repository

## Option 2: Publish to npm (Private/Public)

**Best for:** Reusable across multiple projects

1. **Publish package:**
   ```bash
   cd /Users/arc/Documents/dev/vllm-testing
   npm publish --access public  # or --access restricted for private
   ```

2. **Update package.json:**
   ```json
   {
     "dependencies": {
       "@queeraoke/vllm-testing": "^0.1.0"
     }
   }
   ```

**Pros:**
- ✅ Reusable across projects
- ✅ Version management
- ✅ Works in any CI/CD

**Cons:**
- Requires npm account
- Public packages are public (use private registry for private)

## Option 3: Git Submodule

**Best for:** Shared package across multiple repos

1. **Add as submodule:**
   ```bash
   git submodule add https://github.com/your-org/vllm-testing.git packages/vllm-testing
   ```

2. **Update package.json:**
   ```json
   {
     "dependencies": {
       "@queeraoke/vllm-testing": "file:./packages/vllm-testing"
     }
   }
   ```

**Pros:**
- ✅ Separate repository
- ✅ Version controlled

**Cons:**
- More complex setup
- CI/CD needs submodule init

## Option 4: Bundle Package (Current Setup)

**Best for:** Quick deployment without changes

The current setup (`file:../vllm-testing`) works if:
- Package is in the same parent directory
- CI/CD clones both directories
- Or package is copied during build

**For Vercel:**
- Vercel will install dependencies during build
- Local file dependencies work if package is in repo or accessible

## Recommended: Option 1 (Move to packages/)

This is the simplest and most reliable for deployment.

