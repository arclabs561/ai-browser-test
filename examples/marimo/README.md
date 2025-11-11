# Marimo Notebook Examples for ai-browser-test

These notebooks demonstrate how to use `ai-browser-test` in interactive Python notebooks using [marimo](https://marimo.io).

**Status**: ✅ All notebooks have been reviewed and updated to match the actual API signatures and return types.

**Improvements**:
- ✅ **Pydantic models** (`models.py`) for type-safe validation of API responses
- ✅ **Pydantic Settings** (`config.py`) for configuration management with `.env` support
- ✅ **`uv` support** (`pyproject.toml`) for fast dependency management
- ✅ **Proper error handling** with `ValidationError` for better debugging
- ✅ **Type safety** - All API responses are validated against Pydantic models
- ✅ **IDE support** - Full type hints and autocomplete for validated data

## Prerequisites

1. **Install Python dependencies using uv (recommended):**
   ```bash
   # Install uv if not already installed
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # Navigate to examples/marimo directory
   cd examples/marimo
   
   # Install dependencies
   uv sync
   ```

   Or using pip:
   ```bash
   cd examples/marimo
   pip install marimo pydantic pydantic-settings pillow pandas
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install ai-browser-test
   # For multi-modal and persona examples, also install Playwright:
   npm install @playwright/test
   # Or use the standalone playwright package:
   npm install playwright
   ```

3. **Set up API keys:**
   
   Create a `.env` file in `examples/marimo/`:
   ```bash
   GEMINI_API_KEY=your-key-here
   # or
   OPENAI_API_KEY=your-key-here
   ```
   
   Or export environment variables:
   ```bash
   export GEMINI_API_KEY="your-key-here"
   export OPENAI_API_KEY="your-key-here"
   ```
   
   The notebooks use Pydantic Settings which automatically loads from `.env` files.

## Running the Notebooks

### Option 1: Using uv (recommended)

```bash
cd examples/marimo
uv run marimo edit basic_validation.py
```

### Option 2: Using marimo directly

```bash
marimo edit examples/marimo/basic_validation.py
```

### Option 3: Using sandbox mode

```bash
marimo edit --sandbox examples/marimo/basic_validation.py
```

This automatically installs dependencies in an isolated environment.

## Available Notebooks

### 1. `basic_validation.py`
Basic screenshot validation example:
- Load and display screenshots
- Validate using VLLM
- Display results with scores and issues

### 2. `multi_modal_validation.py`
Multi-modal validation combining:
- Screenshots (visual)
- HTML structure
- CSS styles
- Rendered code

### 3. `persona_testing.py`
Persona-based testing from multiple perspectives:
- Different user types
- Different devices
- Different goals and expectations

## Notes

⚠️ **Important:** These notebooks demonstrate calling the Node.js package from Python. Key points:

1. **Function Signatures:**
   - `validateScreenshot(imagePath, prompt, context)` - Basic screenshot validation
     - Returns `ValidationResult` with `score` (0-10), `issues[]`, `assessment`, `reasoning`, `provider`, `cached`, `estimatedCost`, `responseTime`
     - Context options: `testType`, `viewport`, `useCache`, `timeout`, `useRubric`
   - `multiModalValidation(validateFn, page, testName, options)` - Multi-modal validation
     - `validateFn` must match `validateScreenshot` signature: `(imagePath, prompt, context) => Promise<ValidationResult>`
     - Options: `fps`, `duration`, `captureCode`, `captureState`, `multiPerspective`
   - `experiencePageWithPersonas(page, personas, options)` - Persona-based testing
     - `personas` must be `Persona[]` with structure: `{ name: string, perspective: string, focus: string[] }`
     - Options: `viewport`, `device`, `darkMode`, `timeScale`, `captureScreenshots`, `captureState`, `captureCode`

2. **Return Types:**
   - `validateScreenshot` returns `ValidationResult` with:
     - `score`: number (0-10 scale, not 0-1)
     - `issues`: string[]
     - `assessment`: string | null
     - `reasoning`: string
     - `provider`: string
     - `cached`: boolean
     - `estimatedCost`: { totalCost, inputCost, outputCost, inputTokens, outputTokens } | null
     - `responseTime`: number (milliseconds)
     - `enabled`: boolean (false if API key missing)
   - `multiModalValidation` returns object with: `screenshotPath`, `renderedCode`, `perspectives`, `aggregatedScore` (0-10), `aggregatedIssues`, `timestamp`
   - `experiencePageWithPersonas` returns `PersonaExperienceResult[]` with: `persona`, `notes`, `screenshots`, `renderedCode`, `evaluation` (ValidationResult), `timestamp`

3. **For Playwright integration:**
   - The multi-modal and persona examples require Playwright
   - Install `@playwright/test` or `playwright` as a peer dependency
   - The package uses `"type": "module"` so use ES6 imports in Node.js scripts

4. **Configuration (Optional):**
   - Use `createConfig()` to customize provider, caching, and debug settings
   - Example: `createConfig({ provider: 'gemini', cacheEnabled: true, verbose: true })`
   - If not configured, auto-detects from environment variables

5. **Common testType values:**
   - `'homepage'`, `'payment-screen'`, `'game-ui'`, `'general'`, `'unit-test'`
   - Used for caching and cost tracking

6. **Alternative approaches:**
   - Deploy the Vercel API endpoint and call it via HTTP from Python
   - Use a proper bridge like `nodejs-python-bridge` or `py-node`
   - Use Python's Playwright library and adapt the examples

## Language-Agnostic Usage

The package can be used from any language by:

1. **Using the Vercel API:**
   ```python
   import requests
   
   response = requests.post(
       "https://your-app.vercel.app/api/validate",
       json={
           "image": base64_image,
           "prompt": "Evaluate this screenshot...",
           "context": {"testType": "payment-screen"}
       }
   )
   result = response.json()
   ```

2. **Calling Node.js via subprocess:**
   ```python
   import subprocess
   import json
   
   result = subprocess.run(
       ["node", "validate.mjs"],
       input=json.dumps({"image": base64_image, "prompt": "..."}),
       capture_output=True,
       text=True
   )
   ```

3. **Using a bridge library:**
   - `nodejs-python-bridge`
   - `py-node`
   - Custom FFI bindings

## Standalone Package Usage

The core validation functionality (`validateScreenshot`, `VLLMJudge`) is **standalone** and doesn't require Playwright:

- ✅ Works without Playwright (for screenshot validation)
- ✅ Can be used from any language via API or subprocess
- ✅ Zero runtime dependencies (except Node.js)

Playwright is only required for:
- Multi-modal validation (extracting HTML/CSS)
- Persona-based testing (browser automation)
- Temporal screenshots (capturing over time)

## Next Steps

1. Try the basic validation notebook
2. Experiment with different prompts
3. Test with your own screenshots
4. Explore multi-modal validation
5. Try persona-based testing

For more examples, see the main [README.md](../../README.md).

