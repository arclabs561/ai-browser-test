/**
 * Multi-Modal Validator
 * 
 * Enhanced validation using:
 * 1. Multi-modal inputs: Screenshots + rendered HTML/CSS + game state + principles
 * 2. Multi-perspective: Multiple personas evaluating same state
 * 3. Temporal: Screenshots at different Hz for animations
 * 
 * Note: This module requires Playwright Page object.
 * It's designed to work with @playwright/test but doesn't require it as a hard dependency.
 */

/**
 * Extract rendered HTML/CSS for code analysis
 * 
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} Rendered code structure
 */
export async function extractRenderedCode(page) {
  if (!page || typeof page.evaluate !== 'function') {
    throw new Error('extractRenderedCode requires a Playwright Page object');
  }

  const html = await page.content();
  
  // Extract critical CSS (computed styles for key elements)
  const criticalCSS = await page.evaluate(() => {
    const styles = {};
    const criticalSelectors = [
      '#pride-parade',
      '#pride-footer',
      '#payment-code',
      '#game-paddle',
      '#game-ball',
      '.flag-row',
      '.code',
      'body'
    ];
    
    criticalSelectors.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        const computed = window.getComputedStyle(el);
        styles[selector] = {
          position: computed.position,
          top: computed.top,
          bottom: computed.bottom,
          left: computed.left,
          right: computed.right,
          width: computed.width,
          height: computed.height,
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          display: computed.display,
          visibility: computed.visibility,
          zIndex: computed.zIndex,
          transform: computed.transform,
          opacity: computed.opacity
        };
      }
    });
    
    return styles;
  });
  
  // Extract DOM structure for key elements
  const domStructure = await page.evaluate(() => {
    const structure = {};
    
    // Pride parade structure
    const prideParade = document.querySelector('#pride-parade');
    if (prideParade) {
      structure.prideParade = {
        exists: true,
        flagRowCount: prideParade.querySelectorAll('.flag-row').length,
        position: prideParade.getBoundingClientRect(),
        computedTop: window.getComputedStyle(prideParade).top,
        computedBottom: window.getComputedStyle(prideParade).bottom
      };
    }
    
    // Footer structure
    const prideFooter = document.querySelector('#pride-footer') || document.querySelector('#footer-rainbow');
    if (prideFooter) {
      structure.footer = {
        exists: true,
        position: prideFooter.getBoundingClientRect(),
        computedTop: window.getComputedStyle(prideFooter).top,
        computedBottom: window.getComputedStyle(prideFooter).bottom
      };
    }
    
    // Payment code structure
    const paymentCode = document.querySelector('#payment-code');
    if (paymentCode) {
      structure.paymentCode = {
        exists: true,
        visible: !paymentCode.classList.contains('hidden'),
        text: paymentCode.textContent?.trim(),
        position: paymentCode.getBoundingClientRect()
      };
    }
    
    return structure;
  });
  
  return {
    html: html.substring(0, 10000), // First 10k chars (key structure)
    criticalCSS,
    domStructure,
    timestamp: Date.now()
  };
}

/**
 * Capture temporal screenshots (for animations)
 * 
 * @param {Page} page - Playwright page object
 * @param {number} fps - Frames per second to capture
 * @param {number} duration - Duration in milliseconds
 * @returns {Promise<Array>} Array of screenshot paths
 */
export async function captureTemporalScreenshots(page, fps = 2, duration = 2000) {
  if (!page || typeof page.screenshot !== 'function') {
    throw new Error('captureTemporalScreenshots requires a Playwright Page object');
  }

  const screenshots = [];
  const interval = 1000 / fps; // ms between frames
  const frames = Math.floor(duration / interval);
  
  for (let i = 0; i < frames; i++) {
    const timestamp = Date.now();
    const path = `test-results/temporal-${timestamp}-${i}.png`;
    await page.screenshot({ path, type: 'png' });
    screenshots.push({ path, frame: i, timestamp });
    await page.waitForTimeout(interval);
  }
  
  return screenshots;
}

/**
 * Multi-perspective evaluation
 * Multiple personas evaluate the same state
 * 
 * @param {Function} validateFn - Function to validate screenshot (e.g., validateScreenshot)
 * @param {string} screenshotPath - Path to screenshot
 * @param {Object} renderedCode - Rendered code structure
 * @param {Object} gameState - Game state (optional)
 * @param {Array} personas - Array of persona objects (optional)
 * @returns {Promise<Array>} Array of evaluations
 */
export async function multiPerspectiveEvaluation(validateFn, screenshotPath, renderedCode, gameState = {}, personas = null) {
  if (!validateFn || typeof validateFn !== 'function') {
    throw new Error('multiPerspectiveEvaluation requires a validate function');
  }

  // Default personas if not provided
  const defaultPersonas = [
    {
      name: 'Brutalist Designer',
      perspective: 'I evaluate based on brutalist design principles. Function over decoration. High contrast. Minimal UI.',
      focus: ['brutalist', 'contrast', 'minimalism', 'function']
    },
    {
      name: 'Accessibility Advocate',
      perspective: 'I evaluate based on accessibility standards. WCAG compliance. Keyboard navigation. Screen reader support.',
      focus: ['accessibility', 'wcag', 'keyboard', 'screen-reader']
    },
    {
      name: 'Queer Community Member',
      perspective: 'I evaluate based on queer community values. Inclusivity. Representation. Safe space.',
      focus: ['inclusivity', 'representation', 'community', 'values']
    },
    {
      name: 'Game Designer',
      perspective: 'I evaluate based on game design principles. Game feel. Mechanics. Balance.',
      focus: ['game-feel', 'mechanics', 'balance', 'polish']
    },
    {
      name: 'Product Purpose Validator',
      perspective: 'I evaluate based on product purpose alignment. Primary purpose clarity. Easter egg appropriateness.',
      focus: ['purpose', 'clarity', 'easter-egg', 'alignment']
    }
  ];

  const personasToUse = personas || defaultPersonas;
  
  const evaluations = await Promise.all(
    personasToUse.map(async (persona) => {
      // Build prompt with persona perspective
      const prompt = buildPersonaPrompt(persona, renderedCode, gameState);
      
      const evaluation = await validateFn(screenshotPath, prompt, {
        gameState,
        renderedCode,
        persona: persona.name,
        perspective: persona.perspective,
        focus: persona.focus,
        ...gameState
      }).catch(err => {
        console.warn(`[Multi-Modal] Perspective ${persona.name} failed: ${err.message}`);
        return null;
      });
      
      if (evaluation) {
        return {
          persona: persona.name,
          perspective: persona.perspective,
          focus: persona.focus,
          evaluation
        };
      }
      return null;
    })
  );
  
  return evaluations.filter(e => e !== null);
}

/**
 * Build persona-specific prompt
 */
function buildPersonaPrompt(persona, renderedCode, gameState) {
  const renderedHTML = renderedCode.html ? 
    renderedCode.html.substring(0, 5000) : 
    'HTML not captured';
  
  return `PERSONA PERSPECTIVE: ${persona.name}
${persona.perspective}

FOCUS AREAS: ${persona.focus.join(', ')}

RENDERED CODE ANALYSIS (DOM STRUCTURE):
${JSON.stringify(renderedCode.domStructure, null, 2)}

CRITICAL CSS VALIDATION (COMPUTED STYLES):
${JSON.stringify(renderedCode.criticalCSS, null, 2)}

GAME STATE (IF APPLICABLE):
${JSON.stringify(gameState, null, 2)}

EVALUATION TASK:
Evaluate this state from your persona's perspective. Consider:
1. Visual appearance (from screenshot)
2. Code correctness (from rendered code - check positioning, structure, styles)
3. State consistency (does visual match code and game state?)
4. Principles alignment (does it match design principles and product purpose?)

Provide evaluation from your persona's perspective.`;
}

/**
 * Comprehensive multi-modal validation
 * 
 * @param {Function} validateFn - Function to validate screenshot
 * @param {Page} page - Playwright page object
 * @param {string} testName - Test name
 * @param {Object} options - Options
 * @returns {Promise<Object>} Validation result
 */
export async function multiModalValidation(validateFn, page, testName, options = {}) {
  if (!validateFn || typeof validateFn !== 'function') {
    throw new Error('multiModalValidation requires a validate function');
  }
  if (!page || typeof page.screenshot !== 'function') {
    throw new Error('multiModalValidation requires a Playwright Page object');
  }

  const {
    fps = 2, // Frames per second for temporal sampling
    duration = 2000, // Duration in ms
    captureCode = true,
    captureState = true,
    multiPerspective = true
  } = options;
  
  // 1. Capture screenshot
  const screenshotPath = `test-results/multimodal-${testName}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, type: 'png' });
  
  // 2. Extract rendered code
  const renderedCode = captureCode ? await extractRenderedCode(page) : null;
  
  // 3. Extract game state
  const gameState = captureState ? await page.evaluate(() => {
    return window.gameState || {
      gameActive: false,
      bricks: [],
      ball: null,
      paddle: null
    };
  }) : {};
  
  // 4. Capture temporal screenshots (for animations)
  const temporalScreenshots = fps > 0 ? await captureTemporalScreenshots(page, fps, duration) : [];
  
  // 5. Multi-perspective evaluation
  const perspectives = multiPerspective 
    ? await multiPerspectiveEvaluation(validateFn, screenshotPath, renderedCode, gameState)
    : [];
  
  // 6. Code validation (structural checks)
  const codeValidation = renderedCode ? {
    prideParadePosition: renderedCode.domStructure.prideParade?.computedTop === '0px' || renderedCode.domStructure.prideParade?.computedTop?.startsWith('calc'),
    prideParadeFlagCount: (renderedCode.domStructure.prideParade?.flagRowCount || 0) >= 15,
    flagsDynamicallyGenerated: (renderedCode.domStructure.prideParade?.flagRowCount || 0) >= 15,
    footerPosition: renderedCode.domStructure.footer?.computedBottom === '0px' || renderedCode.domStructure.footer?.computedBottom?.startsWith('calc'),
    footerStripeDynamicallyGenerated: renderedCode.domStructure.footer?.hasStripe === true,
    paymentCodeVisible: renderedCode.domStructure.paymentCode?.visible === true
  } : {};
  
  // 7. Aggregate evaluation
  const aggregatedScore = perspectives.length > 0
    ? perspectives.reduce((sum, p) => sum + (p.evaluation?.score || 0), 0) / perspectives.length
    : null;
  
  const aggregatedIssues = perspectives.length > 0
    ? [...new Set(perspectives.flatMap(p => p.evaluation?.issues || []))]
    : [];
  
  return {
    screenshotPath,
    renderedCode,
    gameState,
    temporalScreenshots,
    perspectives,
    codeValidation,
    aggregatedScore,
    aggregatedIssues,
    timestamp: Date.now()
  };
}

