# Deployment Status

## Vercel Deployment

### Configuration
- ✅ **vercel.json**: Configured with API routes and public files
- ✅ **API Routes**: `/api/validate` and `/api/health` configured
- ✅ **Public Files**: `public/index.html` configured
- ✅ **Serverless Functions**: Using `@vercel/node` runtime

### Environment Variables
Required for deployment:
- `VLM_PROVIDER` (optional, defaults to gemini)
- `GEMINI_API_KEY` (or `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- `DEBUG_VLLM` (optional, for verbose logging)

### Deployment Steps
1. Link project: `vercel link`
2. Set environment variables: `vercel env add`
3. Deploy: `vercel --prod`

### API Endpoints

#### GET /api/health
Health check endpoint that returns service status.

**Response:**
```json
{
  "status": "ok",
  "enabled": true,
  "provider": "gemini",
  "version": "0.1.0",
  "timestamp": "2025-01-27T..."
}
```

#### POST /api/validate
Validates a screenshot using VLLM.

**Request:**
```json
{
  "image": "base64-encoded-image-data",
  "prompt": "Evaluate this screenshot...",
  "context": {
    "testType": "homepage",
    "viewport": { "width": 1280, "height": 720 }
  }
}
```

**Response:**
```json
{
  "enabled": true,
  "provider": "gemini",
  "score": 8.5,
  "issues": [],
  "assessment": "Good",
  "reasoning": "...",
  "estimatedCost": { ... },
  "responseTime": 1234
}
```

### Testing Deployment
```bash
# Health check
curl https://your-deployment.vercel.app/api/health

# Validate screenshot
curl -X POST https://your-deployment.vercel.app/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64-image-data",
    "prompt": "Evaluate this screenshot"
  }'
```

