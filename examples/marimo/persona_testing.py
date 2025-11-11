"""
Persona-Based Testing with ai-browser-test

This notebook demonstrates testing from multiple persona perspectives:
- Different user types (Casual Gamer, Accessibility Advocate, etc.)
- Different perspectives and focus areas
- Human-interpreted time scales for realistic testing

Note: This requires Playwright integration (@playwright/test as peer dependency).
The function signature matches the actual API: experiencePageWithPersonas(page, personas, options)
Persona structure: { name: string, perspective: string, focus: string[] }
"""

import marimo

__generated_with = "0.10.6"
app = marimo.App()


@app.cell
def __():
    import os
    import json
    from pathlib import Path
    from pydantic import ValidationError
    from models import Persona, PersonaExperienceResult
    from config import AppSettings
    
    # Configuration using Pydantic Settings
    settings = AppSettings()
    API_KEY = settings.api_key
    URL = settings.test_url
    
    # Define personas using Pydantic models
    personas = [
        Persona(
            name="Casual Gamer",
            perspective="entertainment",
            focus=["gameplay", "user-experience", "fun-factor"]
        ),
        Persona(
            name="Accessibility Advocate",
            perspective="accessibility",
            focus=["wcag-compliance", "keyboard-navigation", "screen-reader-support"]
        ),
        Persona(
            name="Mobile User",
            perspective="mobile-usability",
            focus=["responsive-design", "touch-interactions", "mobile-performance"]
        )
    ]
    
    return API_KEY, URL, ValidationError, Persona, PersonaExperienceResult, json, os, personas, Path, settings


@app.cell
def __(Persona, personas):
    """
    Step 1: Display personas
    """
    import marimo as mo
    
    persona_cards = []
    for persona in personas:
        # Handle both Pydantic models and dicts
        if isinstance(persona, Persona):
            name = persona.name
            perspective = persona.perspective
            focus = ", ".join(persona.focus)
        else:
            name = persona["name"]
            perspective = persona["perspective"]
            focus = ", ".join(persona["focus"])
        
        persona_cards.append(f"""
        ### {name}
        
        - **Perspective:** {perspective}
        - **Focus Areas:** {focus}
        """)
    
    mo.md("## Test Personas\n\n" + "\n".join(persona_cards))
    
    return mo, persona_cards


@app.cell
def __(API_KEY, URL, json, personas, Persona):
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
            
            const personas = {py_json.dumps([p.model_dump() if isinstance(p, Persona) else p for p in personas])};
            
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
    # In production, these would be validated with PersonaExperienceResult.model_validate()
    results = []
    for persona in personas:
        # Convert Pydantic model to dict if needed
        persona_dict = persona.model_dump() if hasattr(persona, 'model_dump') else persona
        
        # Mock result structure matching PersonaExperienceResult
        result = {{
            "persona": persona_dict,
            "notes": [
                {{
                    "step": "initial_experience",
                    "persona": persona_dict["name"],
                    "observation": f"Arrived at page - viewed from {persona_dict['perspective']} perspective",
                    "timestamp": 1234567890,
                    "elapsed": 0
                }},
                {{
                    "step": "reading",
                    "persona": persona_dict["name"],
                    "observation": f"Reading page content focusing on: {', '.join(persona_dict['focus'])}",
                    "timestamp": 1234567891,
                    "elapsed": 1000
                }}
            ],
            "screenshots": [
                {{
                    "path": f"test-results/persona-{persona_dict['name'].lower().replace(' ', '-')}-page-load-1234567890.png",
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
                "score": 7.5 + (hash(persona_dict["name"]) % 20) / 10,  # Scores are 0-10
                "issues": [] if persona_dict["name"] == "Casual Gamer" else ["Minor accessibility concern"],
                "assessment": f"Good experience from {persona_dict['perspective']} perspective",
                "reasoning": f"Page meets most expectations for {persona_dict['name']}",
                "responseTime": 2500,  # milliseconds
                "cached": False
            }},
            "timestamp": 1234567890
        }}
        results.append(result)
    
    return results, node_script


@app.cell
def __(PersonaExperienceResult, mo, results):
    """
    Step 3: Display persona test results
    """
    import pandas as pd
    
    # Create results table from PersonaExperienceResult structure
    # Handle both validated models and dicts
    rows = []
    for r in results:
        if isinstance(r, PersonaExperienceResult):
            persona_name = r.persona.name
            persona_perspective = r.persona.perspective
            eval_score = r.evaluation.score if r.evaluation else None
            eval_issues = r.evaluation.issues if r.evaluation else []
            eval_response_time = r.evaluation.responseTime if r.evaluation else None
            notes_count = len(r.notes)
            screenshots_count = len(r.screenshots)
        else:
            persona_name = r["persona"]["name"]
            persona_perspective = r["persona"]["perspective"]
            eval_score = r.get("evaluation", {}).get("score")
            eval_issues = r.get("evaluation", {}).get("issues", [])
            eval_response_time = r.get("evaluation", {}).get("responseTime")
            notes_count = len(r.get("notes", []))
            screenshots_count = len(r.get("screenshots", []))
        
        rows.append({
            "Persona": persona_name,
            "Perspective": persona_perspective,
            "Score": f"{eval_score:.2f}" if eval_score is not None else "N/A",
            "Issues": len(eval_issues),
            "Notes": notes_count,
            "Screenshots": screenshots_count,
            "Duration (s)": f"{eval_response_time / 1000:.2f}" if eval_response_time else "N/A"
        })
    
    df = pd.DataFrame(rows)
    mo.ui.table(df)
    
    return df, pd


@app.cell
def __(PersonaExperienceResult, mo, results):
    """
    Step 4: Detailed persona analysis
    """
    for result in results:
        # Try to validate as Pydantic model if it's a dict
        if isinstance(result, dict):
            try:
                validated = PersonaExperienceResult.model_validate(result)
                persona = validated.persona
                evaluation = validated.evaluation
                notes = validated.notes
                screenshots = validated.screenshots
            except Exception:
                # Fallback to dict access
                persona = result.get("persona", {})
                evaluation = result.get("evaluation", {})
                notes = result.get("notes", [])
                screenshots = result.get("screenshots", [])
        else:
            # Already a Pydantic model
            validated = result
            persona = validated.persona
            evaluation = validated.evaluation
            notes = validated.notes
            screenshots = validated.screenshots
        
        # Extract values
        persona_name = persona.name if hasattr(persona, 'name') else persona.get("name", "Unknown")
        persona_perspective = persona.perspective if hasattr(persona, 'perspective') else persona.get("perspective", "Unknown")
        persona_focus = persona.focus if hasattr(persona, 'focus') else persona.get("focus", [])
        
        score = evaluation.score if hasattr(evaluation, 'score') else evaluation.get("score") if evaluation else None
        issues = evaluation.issues if hasattr(evaluation, 'issues') else evaluation.get("issues", []) if evaluation else []
        
        if score is not None:
            # Scores are 0-10, not 0-1
            score_color = "green" if score >= 8 else "orange" if score >= 6 else "red"
            score_display = f"<span style=\"color: {score_color}\">{score:.1f}/10</span>"
        else:
            score_display = "N/A"
        
        mo.md(f"""
        ### {persona_name} Results
        
        **Score:** {score_display}
        **Perspective:** {persona_perspective}
        **Focus Areas:** {", ".join(persona_focus)}
        
        **Notes:** ({len(notes)})
        {chr(10).join(f"- {note.observation if hasattr(note, 'observation') else note.get('observation', note.get('step', 'Unknown'))}" for note in notes[:5])}
        {"..." if len(notes) > 5 else ""}
        
        **Issues:** {len(issues)}
        {chr(10).join(f"- {issue}" for issue in issues) if issues else "None"}
        
        **Screenshots:** {len(screenshots)}
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

