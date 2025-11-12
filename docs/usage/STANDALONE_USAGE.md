# Standalone & Language-Agnostic Usage Guide

## Overview

`ai-visual-test` is designed to be **standalone** and **language-agnostic**. The core validation functionality works without Playwright and can be used from any programming language.

## Standalone Features (No Playwright Required)

These features work **without** Playwright:

✅ **Core Validation:**
- `validateScreenshot()` - Validate screenshots using VLLM
- `VLLMJudge` - Judge class for custom implementations
- `extractSemanticInfo()` - Parse VLLM responses
- `createConfig()` - Configuration management
- `getCached()`, `setCached()` - Caching system
- `extractStructuredData()` - Data extraction from text
- `ScoreTracker` - Score tracking and baselines
- `BatchOptimizer` - Batch request optimization
- `detectBias()` - Bias detection in judgments
- `EnsembleJudge` - Multi-provider ensemble judging

✅ **Utilities:**
- `loadEnv()` - Environment variable loading
- `compressContext()` - Context compression
- `compressStateHistory()` - State history compression
- `aggregateFeedback()` - Feedback aggregation
- `generateRecommendations()` - Recommendation generation
- `buildRubricPrompt()` - Rubric prompt building

## Playwright-Dependent Features

These features **require** Playwright:

⚠️ **Browser Integration:**
- `multiModalValidation()` - Requires Playwright Page object
- `extractRenderedCode()` - Requires Playwright Page object
- `captureTemporalScreenshots()` - Requires Playwright Page object
- `experiencePageAsPersona()` - Requires Playwright Page object
- `experiencePageWithPersonas()` - Requires Playwright Page object

## Language-Agnostic Usage Patterns

### Pattern 1: HTTP API (Recommended)

Deploy the Vercel API endpoint and call it from any language:

```python
# Python example
import requests
import base64

with open("screenshot.png", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode("utf-8")

response = requests.post(
    "https://your-app.vercel.app/api/validate",
    json={
        "image": image_base64,
        "prompt": "Evaluate this screenshot for quality and accessibility.",
        "context": {
            "testType": "payment-screen",
            "viewport": {"width": 1280, "height": 720}
        }
    }
)

result = response.json()
print(f"Score: {result['score']}")
print(f"Issues: {result['issues']}")
```

```ruby
# Ruby example
require 'net/http'
require 'json'
require 'base64'

image_base64 = Base64.strict_encode64(File.read("screenshot.png"))

uri = URI('https://your-app.vercel.app/api/validate')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
request.body = {
  image: image_base64,
  prompt: "Evaluate this screenshot...",
  context: {
    testType: "payment-screen"
  }
}.to_json

response = http.request(request)
result = JSON.parse(response.body)
puts "Score: #{result['score']}"
```

```go
// Go example
package main

import (
    "bytes"
    "encoding/base64"
    "encoding/json"
    "io/ioutil"
    "net/http"
)

func main() {
    imageData, _ := ioutil.ReadFile("screenshot.png")
    imageBase64 := base64.StdEncoding.EncodeToString(imageData)

    payload := map[string]interface{}{
        "image": imageBase64,
        "prompt": "Evaluate this screenshot...",
        "context": map[string]interface{}{
            "testType": "payment-screen",
        },
    }

    jsonData, _ := json.Marshal(payload)
    resp, _ := http.Post(
        "https://your-app.vercel.app/api/validate",
        "application/json",
        bytes.NewBuffer(jsonData),
    )

    body, _ := ioutil.ReadAll(resp.Body)
    var result map[string]interface{}
    json.Unmarshal(body, &result)
    // Use result
}
```

### Pattern 2: Subprocess (Node.js Required)

Call Node.js scripts from your language:

```python
# Python example
import subprocess
import json
import base64

# Create Node.js script
script = f"""
import {{ validateScreenshot }} from 'ai-visual-test';

const result = await validateScreenshot(
    'screenshot.png',
    'Evaluate this screenshot...',
    {{ testType: 'payment-screen' }}
);

console.log(JSON.stringify(result));
"""

# Write and execute
with open("temp_validate.mjs", "w") as f:
    f.write(script)

result = subprocess.run(
    ["node", "temp_validate.mjs"],
    capture_output=True,
    text=True,
    env={**os.environ, "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY")}
)

data = json.loads(result.stdout)
print(f"Score: {data['score']}")
```

### Pattern 3: Bridge Libraries

Use language bridges to call Node.js directly:

**Python:**
- `nodejs-python-bridge`
- `py-node`
- `nodejs-python`

**Ruby:**
- `nodejs-ruby`
- `execjs` (with Node.js runtime)

**Go:**
- Custom FFI bindings
- `go-nodejs` (if available)

### Pattern 4: WebAssembly (Future)

The package could be compiled to WebAssembly for browser use:

```javascript
// Future: Browser usage
import { validateScreenshot } from 'ai-visual-test/wasm';

const result = await validateScreenshot(
    imageBlob,
    "Evaluate this screenshot...",
    { testType: "payment-screen" }
);
```

## Standalone Usage Examples

### Example 1: Python with Screenshots

```python
import subprocess
import json
import base64
from pathlib import Path

def validate_screenshot(image_path, prompt, context=None):
    """Validate a screenshot using ai-visual-test"""
    
    # Create Node.js script
    script = f"""
    import {{ validateScreenshot }} from 'ai-visual-test';
    
    const result = await validateScreenshot(
        '{image_path}',
        '{prompt}',
        {json.dumps(context or {})}
    );
    
    console.log(JSON.stringify(result));
    """
    
    # Execute
    result = subprocess.run(
        ["node", "-e", script],
        capture_output=True,
        text=True,
        env={**os.environ}
    )
    
    return json.loads(result.stdout)

# Usage
result = validate_screenshot(
    "screenshot.png",
    "Evaluate this screenshot for accessibility and design quality.",
    {"testType": "homepage"}
)

print(f"Score: {result['score']}")
print(f"Issues: {result['issues']}")
```

### Example 2: Ruby with API

```ruby
require 'net/http'
require 'json'
require 'base64'

class AIBrowserTest
  def initialize(api_url)
    @api_url = api_url
  end

  def validate_screenshot(image_path, prompt, context = {})
    image_base64 = Base64.strict_encode64(File.read(image_path))
    
    uri = URI("#{@api_url}/api/validate")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    
    request = Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
    request.body = {
      image: image_base64,
      prompt: prompt,
      context: context
    }.to_json
    
    response = http.request(request)
    JSON.parse(response.body)
  end
end

# Usage
client = AIBrowserTest.new("https://your-app.vercel.app")
result = client.validate_screenshot(
  "screenshot.png",
  "Evaluate this screenshot...",
  { testType: "payment-screen" }
)

puts "Score: #{result['score']}"
```

## Package Structure for Standalone Use

```
ai-visual-test/
├── src/
│   ├── judge.mjs          # ✅ Standalone (core validation)
│   ├── config.mjs         # ✅ Standalone
│   ├── cache.mjs          # ✅ Standalone
│   ├── errors.mjs         # ✅ Standalone
│   ├── data-extractor.mjs # ✅ Standalone
│   ├── score-tracker.mjs  # ✅ Standalone
│   ├── batch-optimizer.mjs # ✅ Standalone
│   ├── bias-detector.mjs  # ✅ Standalone
│   ├── ensemble-judge.mjs  # ✅ Standalone
│   ├── multi-modal.mjs    # ⚠️ Requires Playwright
│   └── persona-experience.mjs # ⚠️ Requires Playwright
├── api/
│   └── validate.js        # ✅ Standalone (HTTP API)
└── package.json
```

## Dependencies

### Runtime Dependencies
- **None** - Zero runtime dependencies

### Peer Dependencies
- `@playwright/test` (optional) - Only needed for browser features

### Engine Requirements
- Node.js >= 18.0.0 (for running the package)
- Any language (for calling via API or subprocess)

## Best Practices

1. **Use HTTP API for language-agnostic access**
   - Deploy to Vercel
   - Call from any language
   - No Node.js required on client

2. **Use subprocess for simple integrations**
   - Good for Python/Ruby scripts
   - Requires Node.js installed
   - Simple but less efficient

3. **Use bridge libraries for performance**
   - Better performance than subprocess
   - More complex setup
   - Language-specific

4. **Keep Playwright optional**
   - Core validation works standalone
   - Add Playwright only for browser features
   - Use `peerDependencies` for optional deps

## Examples

See the `examples/` directory for:
- **marimo/** - Python notebook examples
- **api/** - HTTP API usage
- **test/** - Node.js test examples

## Summary

✅ **Standalone:** Core validation works without Playwright  
✅ **Language-Agnostic:** Use via HTTP API or subprocess  
✅ **Zero Dependencies:** No runtime dependencies  
✅ **Optional Playwright:** Only needed for browser features  
✅ **Flexible:** Use from Python, Ruby, Go, or any language

