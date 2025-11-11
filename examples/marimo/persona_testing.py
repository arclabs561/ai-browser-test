"""
Persona-Based Testing with ai-browser-test

This notebook demonstrates testing from multiple persona perspectives:
- Different user types (Casual Gamer, Accessibility Advocate, etc.)
- Different devices (mobile, tablet, desktop)
- Different goals and expectations

Note: This requires Playwright integration.
"""

import marimo

__generated_with = "0.10.6"
app = marimo.App()


@app.cell
def __():
    import os
    import json
    from pathlib import Path
    
    # Configuration
    API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
    URL = "https://example.com"
    
    # Define personas
    # Persona structure: { name: string, perspective: string, focus: string[] }
    # Note: device is optional and can be passed in options
    personas = [
        {
            "name": "Casual Gamer",
            "perspective": "entertainment",
            "focus": ["gameplay", "user-experience", "fun-factor"]
        },
        {
            "name": "Accessibility Advocate",
            "perspective": "accessibility",
            "focus": ["wcag-compliance", "keyboard-navigation", "screen-reader-support"]
        },
        {
            "name": "Mobile User",
            "perspective": "mobile-usability",
            "focus": ["responsive-design", "touch-interactions", "mobile-performance"]
        }
    ]
    
    return API_KEY, URL, json, os, personas, Path


@app.cell
def __(personas):
    """
    Step 1: Display personas
    """
    import marimo as mo
    
    persona_cards = []
    for persona in personas:
        persona_cards.append(f"""
        ### {persona["name"]}
        
        - **Perspective:** {persona["perspective"]}
        - **Focus Areas:** {", ".join(persona["focus"])}
        """)
    
    mo.md("## Test Personas\n\n" + "\n".join(persona_cards))
    
    return mo, persona_cards


@app.cell
def __(API_KEY, URL, json, personas):
    """
    Step 2: Run persona-based testing
    
    In production, this would call:
    experiencePageWithPersonas(page, personas, options)
    
    Note: This requires Playwright. The actual return type is PersonaExperienceResult[]
    which includes: persona, notes, screenshots, renderedCode, gameState, evaluation, timestamp
    """
    import json as py_json
    
    # Create Node.js script for persona testing
    node_script = f"""
    import {{ experiencePageWithPersonas }} from 'ai-browser-test';
    import {{ chromium }} from 'playwright';
    
    async function run() {{
        const browser = await chromium.launch();
        const page = await browser.newPage();
        
        try {{
            await page.goto({py_json.dumps(URL)});
            
            const personas = {py_json.dumps(personas)};
            
            // experiencePageWithPersonas signature: (page, personas, options)
            const results = await experiencePageWithPersonas(
                page,
                personas,
                {{
                    viewport: {{ width: 1280, height: 720 }},
                    device: 'desktop',
                    captureScreenshots: true,
                    captureState: true,
                    captureCode: true
                }}
            );
            
            console.log(JSON.stringify(results, null, 2));
        }} catch (error) {{
            console.error(JSON.stringify({{ error: error.message, stack: error.stack }}));
            process.exit(1);
        }} finally {{
            await browser.close();
        }}
    }}
    
    run();
    """
    
    print("📝 Persona testing script created")
    print("   (In production, this would execute and return results)")
    print("   Note: Requires @playwright/test to be installed")
    
    # Mock results matching actual PersonaExperienceResult structure
    results = []
    for persona in personas:
        # Mock result structure matching PersonaExperienceResult
        result = {{
            "persona": persona,
            "notes": [
                {{
                    "step": "initial_experience",
                    "persona": persona["name"],
                    "observation": f"Arrived at page - viewed from {persona['perspective']} perspective",
                    "timestamp": 1234567890,
                    "elapsed": 0
                }},
                {{
                    "step": "reading",
                    "persona": persona["name"],
                    "observation": f"Reading page content focusing on: {', '.join(persona['focus'])}",
                    "timestamp": 1234567891,
                    "elapsed": 1000
                }}
            ],
            "screenshots": [
                {{
                    "path": f"test-results/persona-{persona['name'].lower().replace(' ', '-')}-page-load-1234567890.png",
                    "timestamp": 1234567890,
                    "elapsed": 0,
                    "step": "page-load",
                    "description": "Page loaded"
                }}
            ],
            "renderedCode": {{
                "html": "<html>...</html>",
                "css": "body {{ ... }}",
                "domStructure": {{}}
            }},
            "gameState": {{}},
            "evaluation": {{
                "enabled": True,
                "provider": "gemini",
                "score": 0.75 + (hash(persona["name"]) % 20) / 100,
                "issues": [] if persona["name"] == "Casual Gamer" else ["Minor accessibility concern"],
                "assessment": f"Good experience from {persona['perspective']} perspective",
                "reasoning": f"Page meets most expectations for {persona['name']}",
                "responseTime": 2.5,
                "cached": False
            }},
            "timestamp": 1234567890
        }}
        results.append(result)
    
    return results, node_script


@app.cell
def __(mo, results):
    """
    Step 3: Display persona test results
    """
    import pandas as pd
    
    # Create results table from PersonaExperienceResult structure
    df = pd.DataFrame([
        {
            "Persona": r["persona"]["name"],
            "Perspective": r["persona"]["perspective"],
            "Score": f"{r['evaluation']['score']:.2f}" if r.get("evaluation", {}).get("score") is not None else "N/A",
            "Issues": len(r.get("evaluation", {}).get("issues", [])),
            "Notes": len(r.get("notes", [])),
            "Screenshots": len(r.get("screenshots", [])),
            "Duration (s)": r.get("evaluation", {}).get("responseTime", "N/A")
        }
        for r in results
    ])
    
    mo.ui.table(df)
    
    return df, pd


@app.cell
def __(mo, results):
    """
    Step 4: Detailed persona analysis
    """
    for result in results:
        persona_name = result["persona"]["name"]
        evaluation = result.get("evaluation", {})
        score = evaluation.get("score")
        
        if score is not None:
            score_color = "green" if score >= 0.8 else "orange" if score >= 0.6 else "red"
            score_display = f"<span style=\"color: {score_color}\">{score:.2f}/1.0</span>"
        else:
            score_display = "N/A"
        
        notes = result.get("notes", [])
        issues = evaluation.get("issues", [])
        
        mo.md(f"""
        ### {persona_name} Results
        
        **Score:** {score_display}
        **Perspective:** {result["persona"]["perspective"]}
        **Focus Areas:** {", ".join(result["persona"]["focus"])}
        
        **Notes:** ({len(notes)})
        {chr(10).join(f"- {note.get('observation', note.get('step', 'Unknown'))}" for note in notes[:5])}
        {"..." if len(notes) > 5 else ""}
        
        **Issues:** {len(issues)}
        {chr(10).join(f"- {issue}" for issue in issues) if issues else "None"}
        
        **Screenshots:** {len(result.get("screenshots", []))}
        """)
    
    return


@app.cell
def __():
    """
    Benefits of Persona-Based Testing
    
    1. **Multiple Perspectives**: Same page evaluated from different viewpoints
    2. **Real-World Scenarios**: Tests actual user goals and expectations
    3. **Device-Specific**: Validates responsive design and device compatibility
    4. **Comprehensive Coverage**: Catches issues that single-perspective testing might miss
    """
    return

