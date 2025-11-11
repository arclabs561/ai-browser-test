"""
Multi-Modal Validation with ai-browser-test

This notebook demonstrates multi-modal validation combining:
- Screenshots (visual)
- HTML structure
- CSS styles
- Rendered code

Note: This requires Playwright integration (@playwright/test as peer dependency).
The function signature matches the actual API: multiModalValidation(validateFn, page, testName, options)
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
    from pydantic import ValidationError
    from models import MultiModalValidationResult
    from config import AppSettings
    
    # Configuration using Pydantic Settings
    settings = AppSettings()
    API_KEY = settings.api_key
    URL = settings.test_url
    
    return API_KEY, Path, URL, ValidationError, MultiModalValidationResult, json, os, settings, subprocess


@app.cell
def __(API_KEY):
    """
    Setup: Check configuration
    """
    if not API_KEY:
        print("⚠️  Warning: No API key found")
    else:
        print("✅ API key configured")
    
    print(f"🌐 Target URL: {URL}")
    
    return


@app.cell
def __(API_KEY, URL, json, subprocess):
    """
    Step 1: Capture screenshot and extract rendered code
    
    This would typically use Playwright in a real scenario.
    Here we demonstrate the concept.
    """
    # Create Node.js script for multi-modal validation
    # Note: multiModalValidation requires a validateFn that matches validateScreenshot signature
    import json as py_json
    
    node_script = f"""
    import {{ multiModalValidation, validateScreenshot }} from 'ai-browser-test';
    import {{ chromium }} from 'playwright';
    
    async function run() {{
        const browser = await chromium.launch();
        const page = await browser.newPage();
        
        try {{
            await page.goto({py_json.dumps(URL)});
            
            // multiModalValidation signature: (validateFn, page, testName, options)
            // validateFn must match: (imagePath, prompt, context) => Promise<ValidationResult>
            const result = await multiModalValidation(
                validateScreenshot,  // Use the actual validateScreenshot function
                page,
                'homepage-test',
                {{
                    fps: 2,
                    duration: 2000,
                    captureCode: true,
                    captureState: true,
                    multiPerspective: true
                }}
            );
            
            console.log(JSON.stringify(result, null, 2));
        }} catch (error) {{
            console.error(JSON.stringify({{ error: error.message, stack: error.stack }}));
            process.exit(1);
        }} finally {{
            await browser.close();
        }}
    }}
    
    run();
    """
    
    # In a real scenario, you would:
    # 1. Write the script to a file
    # 2. Run it with Node.js
    # 3. Parse the JSON output
    
    print("📝 Multi-modal validation script created")
    print("   (In production, this would execute and return results)")
    print("   Note: Requires @playwright/test to be installed")
    
    # Mock result structure matching actual multiModalValidation return type
    # In production, this would be validated with MultiModalValidationResult
    mock_result = {{
        "screenshotPath": "test-results/multimodal-homepage-test-1234567890.png",
        "renderedCode": {{
            "html": "<html>...</html>",
            "css": "body {{ ... }}",
            "domStructure": {{}}
        }},
        "gameState": {{}},
        "temporalScreenshots": [],
        "perspectives": [
            {{
                "persona": "Design Critic",
                "perspective": "visual-design",
                "focus": "aesthetics",
                "evaluation": {{
                    "score": 8.5,
                    "issues": ["Minor contrast issue"],
                    "assessment": "Good overall design",
                    "reasoning": "Well-structured layout with minor improvements needed"
                }}
            }}
        ],
        "codeValidation": {{}},
        "aggregatedScore": 8.5,
        "aggregatedIssues": ["Minor contrast issue"],
        "timestamp": 1234567890
    }}
    
    return mock_result, node_script


@app.cell
def __(mock_result):
    """
    Step 2: Display multi-modal results
    """
    import marimo as mo
    
    result = mock_result
    
    # Extract scores from perspectives if available (scores are 0-10, not 0-1)
    perspective_scores = [p["evaluation"]["score"] for p in result.get("perspectives", []) if p.get("evaluation", {}).get("score") is not None]
    avg_score = result.get("aggregatedScore") or (sum(perspective_scores) / len(perspective_scores) if perspective_scores else None)
    
    score_display = f"{avg_score:.1f}/10" if avg_score is not None else "N/A"
    
    mo.md(f"""
    ## Multi-Modal Validation Results
    
    ### Screenshot Path
    - **Path:** {result.get("screenshotPath", "N/A")}
    
    ### Rendered Code Analysis
    - **HTML:** Extracted ({len(result.get("renderedCode", {}).get("html", ""))} chars)
    - **CSS:** Extracted ({len(result.get("renderedCode", {}).get("css", ""))} chars)
    - **DOM Structure:** Analyzed
    
    ### Multi-Perspective Evaluation
    - **Perspectives:** {len(result.get("perspectives", []))}
    - **Aggregated Score:** {score_display}
    - **Aggregated Issues:** {len(result.get("aggregatedIssues", []))}
    """)
    
    return mo, result


@app.cell
def __(result):
    """
    Step 3: Detailed analysis
    """
    import marimo as mo
    
    # Display perspectives
    if result.get("perspectives"):
        perspective_text = []
        for p in result["perspectives"]:
            eval_data = p.get("evaluation", {})
            score = eval_data.get("score", "N/A")
            issues = eval_data.get("issues", [])
            score_str = f"{score:.1f}/10" if isinstance(score, (int, float)) else str(score)
            issues_text = chr(10).join(f"  - {issue}" for issue in issues) if issues else "  - None"
            perspective_text.append(f"""
            ### {p.get("persona", "Unknown")} Perspective
            - **Score:** {score_str}
            - **Focus:** {p.get("focus", "N/A")}
            - **Issues:** {len(issues)}
            {issues_text}
            """)
        mo.md("## Perspective Details\n" + "\n".join(perspective_text))
    
    # Display aggregated issues
    if result.get("aggregatedIssues"):
        mo.md(f"""
        ### Aggregated Issues
        
        {chr(10).join(f"- {issue}" for issue in result["aggregatedIssues"])}
        """)
    
    # Display rendered code preview
    rendered_code = result.get("renderedCode", {})
    if rendered_code:
        mo.md(f"""
        ### Rendered Code Preview
        
        **HTML Structure:**
        ```html
        {rendered_code.get("html", "")[:200]}...
        ```
        
        **CSS:**
        ```css
        {rendered_code.get("css", "")[:200]}...
        ```
        """)
    
    return mo,


@app.cell
def __():
    """
    Benefits of Multi-Modal Validation
    
    1. **Visual + Code**: Catches issues in both appearance and implementation
    2. **Context-Aware**: Understands the relationship between code and visual output
    3. **Comprehensive**: Validates accessibility, design, and code quality together
    4. **Actionable**: Provides specific feedback on what to fix
    """
    return

