"""
Basic Screenshot Validation with ai-browser-test

This notebook demonstrates how to use ai-browser-test for basic
screenshot validation using Vision Language Models (VLLM).

Note: This is a conceptual example. In practice, you would need
to call the Node.js package from Python using subprocess or a bridge.
"""

import marimo

__generated_with = "0.10.6"
app = marimo.App()


@app.cell
def __():
    import os
    import json
    import subprocess
    from pathlib import Path
    import base64
    from PIL import Image
    import io
    
    # Configuration
    API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
    SCREENSHOT_PATH = "screenshot.png"
    
    return API_KEY, Image, Path, base64, io, json, os, subprocess, SCREENSHOT_PATH


@app.cell
def __(API_KEY):
    """
    Setup: Check if API key is configured
    """
    if not API_KEY:
        print("⚠️  Warning: No API key found. Set GEMINI_API_KEY or OPENAI_API_KEY")
        print("   The package will run in disabled mode.")
    else:
        print("✅ API key configured")
    
    return


@app.cell
def __(SCREENSHOT_PATH, Path):
    """
    Step 1: Check if screenshot exists
    """
    screenshot_path = Path(SCREENSHOT_PATH)
    
    if not screenshot_path.exists():
        print(f"❌ Screenshot not found: {SCREENSHOT_PATH}")
        print("   Please provide a screenshot file.")
        screenshot_available = False
    else:
        print(f"✅ Screenshot found: {SCREENSHOT_PATH}")
        screenshot_available = True
    
    return screenshot_available, screenshot_path


@app.cell
def __(screenshot_available, screenshot_path, base64, io, Image):
    """
    Step 2: Load and display screenshot
    """
    if screenshot_available:
        # Load image
        img = Image.open(screenshot_path)
        
        # Display image
        display(img)
        
        # Get image info
        width, height = img.size
        print(f"📐 Image size: {width}x{height} pixels")
        
        # Convert to base64 for API
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        image_info = {
            "width": width,
            "height": height,
            "base64": img_base64[:50] + "..."  # Preview only
        }
    else:
        image_info = None
    
    return height, image_info, img, width


@app.cell
def __(API_KEY, height, image_info, json, os, screenshot_path, subprocess, width):
    """
    Step 3: Validate screenshot using ai-browser-test
    
    This calls the Node.js package via subprocess.
    In production, you might use a proper Python bridge.
    """
    if not image_info:
        result = None
        print("⏭️  Skipping validation (no screenshot)")
    else:
        # Create a Node.js script to call the package
        # Note: Using JSON.stringify to properly escape the path
        import json as py_json
        screenshot_path_str = str(screenshot_path.resolve())
        
        node_script = f"""
        import {{ validateScreenshot }} from 'ai-browser-test';
        
        async function run() {{
            const result = await validateScreenshot(
                {py_json.dumps(screenshot_path_str)},
                'Evaluate this screenshot for quality, accessibility, and design principles.',
                {{
                    testType: 'general',
                    viewport: {{ width: {width}, height: {height} }}
                }}
            );
            
            console.log(JSON.stringify(result, null, 2));
        }}
        
        run().catch(err => {{
            console.error(JSON.stringify({{ error: err.message, stack: err.stack }}));
            process.exit(1);
        }});
        """
        
        # Write temporary script
        script_path = Path("temp_validate.mjs")
        script_path.write_text(node_script)
        
        try:
            # Run Node.js script
            process = subprocess.run(
                ["node", str(script_path)],
                capture_output=True,
                text=True,
                env={**os.environ, "GEMINI_API_KEY": API_KEY or ""}
            )
            
            if process.returncode == 0:
                result = json.loads(process.stdout)
                print("✅ Validation completed")
            else:
                # Try to parse error as JSON, fallback to plain text
                try:
                    error_data = json.loads(process.stderr)
                    result = {"error": error_data.get("error", process.stderr)}
                except:
                    result = {"error": process.stderr}
                print(f"❌ Validation failed: {process.stderr}")
        except json.JSONDecodeError as e:
            result = {"error": f"Failed to parse result: {e}", "raw_output": process.stdout}
            print(f"❌ JSON parse error: {e}")
        except Exception as e:
            result = {"error": str(e)}
            print(f"❌ Error: {e}")
        finally:
            # Clean up
            if script_path.exists():
                script_path.unlink()
    
    return result,


@app.cell
def __(result):
    """
    Step 4: Display validation results
    """
    import marimo as mo
    
    if result and "error" not in result:
        if result.get("enabled", True):
            score = result.get("score")
            issues = result.get("issues", [])
            assessment = result.get("assessment", "")
            reasoning = result.get("reasoning", "")
            
            # Display score
            if score is not None:
                score_color = "green" if score >= 0.8 else "orange" if score >= 0.6 else "red"
                mo.md(f"""
                ## Validation Results
                
                **Score:** <span style="color: {score_color}">{score:.2f}/1.0</span>
                
                **Provider:** {result.get("provider", "unknown")}
                **Cached:** {result.get("cached", False)}
                """)
            else:
                mo.md("## Validation Results\n\n⚠️ No score available")
            
            # Display issues
            if issues:
                mo.md(f"""
                ### Issues Found ({len(issues)})
                
                {chr(10).join(f"- {issue}" for issue in issues)}
                """)
            
            # Display assessment
            if assessment:
                mo.md(f"""
                ### Assessment
                
                {assessment}
                """)
            
            # Display reasoning
            if reasoning:
                mo.md(f"""
                ### Reasoning
                
                {reasoning[:500]}{"..." if len(reasoning) > 500 else ""}
                """)
        else:
            mo.md(f"""
            ## Validation Disabled
            
            {result.get("message", "API key not configured")}
            """)
    elif result and "error" in result:
        mo.md(f"""
        ## Error
        
        {result["error"]}
        """)
    else:
        mo.md("## No Results\n\nRun validation to see results.")
    
    return mo,


@app.cell
def __():
    """
    Next Steps
    
    - Try different prompts for specific evaluations
    - Test with different viewport sizes
    - Use multi-modal validation (screenshot + HTML + CSS)
    - Explore persona-based testing
    """
    return

