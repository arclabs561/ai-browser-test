/**
 * Persona-Based Page Experience Testing
 * 
 * Tests page experience from different persona perspectives with human-interpreted time scales.
 * 
 * Not just gameplay - any page experience can be tested with personas.
 * Time scales are human-interpreted (reading time, interaction time, etc.) not mechanical fps.
 */

/**
 * Experience a page from a persona's perspective
 * 
 * @param {Page} page - Playwright page object
 * @param {Object} persona - Persona configuration
 * @param {Object} options - Experience options
 * @returns {Promise<Object>} Experience result with notes, screenshots, and evaluation
 */
export async function experiencePageAsPersona(page, persona, options = {}) {
  const {
    viewport = { width: 1280, height: 720 },
    device = 'desktop',
    darkMode = false,
    timeScale = 'human', // 'human' (reading/interaction time) or 'mechanical' (fps)
    captureScreenshots = true,
    captureState = true,
    captureCode = true,
    notes = [],
    trace = null // Optional ExperienceTrace instance
  } = options;

  const experienceNotes = [...notes];
  const screenshots = [];
  const startTime = Date.now();
  
  // If trace provided, add initial event
  if (trace) {
    trace.addEvent('experience-start', {
      persona: persona.name,
      viewport,
      device,
      timeScale
    });
  }
  
  // Helper to capture screenshot at current state
  const captureScreenshotNow = async (step, description) => {
    if (!captureScreenshots) return null;
    
    const timestamp = Date.now();
    const elapsed = timestamp - startTime;
    const screenshotPath = `test-results/persona-${persona.name.toLowerCase().replace(/\s+/g, '-')}-${step}-${timestamp}.png`;
    
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      screenshots.push({
        path: screenshotPath,
        timestamp,
        elapsed,
        step,
        description
      });
      return screenshotPath;
    } catch (error) {
      console.warn(`Failed to capture screenshot at step ${step}:`, error.message);
      return null;
    }
  };

  // Set viewport based on persona device preference
  if (persona.device) {
    const deviceViewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 720 }
    };
    await page.setViewportSize(deviceViewports[persona.device] || viewport);
  } else {
    await page.setViewportSize(viewport);
  }

  // Navigate to page
  await page.goto(options.url || options.baseURL || 'about:blank', {
    waitUntil: 'domcontentloaded'
  });
  
  // Capture screenshot immediately after page load
  const pageLoadScreenshot = await captureScreenshotNow('page-load', 'Page loaded');
  if (trace && pageLoadScreenshot) {
    trace.addScreenshot(pageLoadScreenshot, 'page-load');
  }

  // Step 1: Initial page load experience (human time scale)
  const initialLoadTime = await humanTimeScale('page-load', {
    minTime: 1000, // Minimum 1 second to read page
    maxTime: 5000, // Maximum 5 seconds for slow readers
    timeScale
  });

  await page.waitForTimeout(initialLoadTime);
  
  // Capture after initial reading time
  await captureScreenshotNow('after-initial-read', 'After initial reading time');

  // Extract initial state
  let renderedCode = null;
  let pageState = null;

  if (captureCode) {
    renderedCode = await extractRenderedCode(page);
  }

  if (captureState) {
    pageState = await page.evaluate(() => {
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent || '',
        description: document.querySelector('meta[name="description"]')?.content || '',
        viewport: { width: window.innerWidth, height: window.innerHeight },
        darkMode: document.documentElement.classList.contains('dark') || 
                 window.matchMedia('(prefers-color-scheme: dark)').matches
      };
    });
  }

  // Persona's initial observation
  experienceNotes.push({
    step: 'initial_experience',
    persona: persona.name,
    device: persona.device || device,
    viewport: await page.viewportSize(),
    observation: `Arrived at page - ${pageState?.title || 'unknown'}`,
    pageState,
    renderedCode: renderedCode ? { html: renderedCode.html?.substring(0, 500) } : null,
    timestamp: Date.now(),
    elapsed: Date.now() - startTime
  });

  // Step 2: Reading/scanning experience (human time scale)
  if (trace) {
    trace.addEvent('observation', {
      step: 'before-reading',
      observation: 'About to read/scan page content'
    });
  }
  await captureScreenshotNow('before-reading', 'Before reading/scanning');
  
  const readingTime = await humanTimeScale('reading', {
    minTime: 2000, // Minimum 2 seconds to read/scan
    maxTime: 10000, // Maximum 10 seconds for thorough reading
    timeScale,
    contentLength: pageState?.h1?.length || 0
  });

  await page.waitForTimeout(readingTime);
  
  // Capture after reading
  if (trace) {
    trace.addEvent('observation', {
      step: 'after-reading',
      observation: 'Finished reading/scanning page content'
    });
  }
  await captureScreenshotNow('after-reading', 'After reading/scanning');

  // Step 3: Interaction experience (if persona has goals)
  if (persona.goals && persona.goals.length > 0) {
    for (const goal of persona.goals) {
      // Capture before interaction
      await captureScreenshotNow(`before-${goal}`, `Before ${goal}`);
      
      const interactionTime = await humanTimeScale('interaction', {
        minTime: 500, // Minimum 0.5 seconds to interact
        maxTime: 3000, // Maximum 3 seconds for complex interactions
        timeScale,
        interactionType: goal
      });

      // Simulate persona trying to achieve goal
      // This is extensible - different personas interact differently
      await simulatePersonaInteraction(page, persona, goal);
      
      // Capture immediately after interaction (before delay)
      await captureScreenshotNow(`during-${goal}`, `During ${goal}`);

      await page.waitForTimeout(interactionTime);
      
      // Capture after interaction delay
      await captureScreenshotNow(`after-${goal}`, `After ${goal}`);

      // Update state
      if (captureState) {
        pageState = await page.evaluate(() => {
          return {
            title: document.title,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            activeElement: document.activeElement?.tagName || null
          };
        });
      }

      experienceNotes.push({
        step: `interaction_${goal}`,
        persona: persona.name,
        goal,
        observation: `Attempted to ${goal}`,
        pageState,
        timestamp: Date.now(),
        elapsed: Date.now() - startTime
      });
    }
  }
  
  // Capture final state
  const finalScreenshot = await captureScreenshotNow('final-state', 'Final state');
  if (trace && finalScreenshot) {
    trace.addScreenshot(finalScreenshot, 'final-state');
  }
  
  // Add final event to trace
  if (trace) {
    trace.addEvent('experience-end', {
      duration: Date.now() - startTime,
      noteCount: experienceNotes.length,
      screenshotCount: screenshots.length
    });
  }

  return {
    persona: persona.name,
    device: persona.device || device,
    viewport: await page.viewportSize(),
    notes: experienceNotes,
    screenshots,
    renderedCode,
    pageState,
    duration: Date.now() - startTime,
    timeScale,
    trace: trace ? trace.getSummary() : null
  };
}

/**
 * Human-interpreted time scale
 * 
 * Not mechanical fps - human reading/interaction time based on content and context.
 * 
 * @param {string} action - Action type ('page-load', 'reading', 'interaction')
 * @param {Object} options - Time scale options
 * @returns {Promise<number>} Time in milliseconds
 */
async function humanTimeScale(action, options = {}) {
  const {
    minTime = 1000,
    maxTime = 5000,
    timeScale = 'human',
    contentLength = 0,
    interactionType = null
  } = options;

  if (timeScale === 'mechanical') {
    // Mechanical fps - fixed intervals
    return 1000 / 2; // 2 fps = 500ms
  }

  // Human-interpreted time scale
  switch (action) {
    case 'page-load':
      // Page load: 1-5 seconds depending on complexity
      return Math.random() * (maxTime - minTime) + minTime;

    case 'reading':
      // Reading: Based on content length
      // Average reading speed: 200-300 words per minute
      // Rough estimate: 1 word = 5 characters
      const words = contentLength / 5;
      const readingSpeed = 250; // words per minute
      const readingTime = (words / readingSpeed) * 60 * 1000; // milliseconds
      return Math.max(minTime, Math.min(maxTime, readingTime));

    case 'interaction':
      // Interaction: Based on interaction type
      const interactionTimes = {
        'click': 500,
        'type': 1000,
        'scroll': 800,
        'read': 2000,
        'think': 1500
      };
      return interactionTimes[interactionType] || minTime;

    default:
      return minTime;
  }
}

/**
 * Simulate persona interaction
 * 
 * Different personas interact differently based on their goals and concerns.
 * 
 * @param {Page} page - Playwright page object
 * @param {Object} persona - Persona configuration
 * @param {string} goal - Goal to achieve
 */
async function simulatePersonaInteraction(page, persona, goal) {
  // This is extensible - different personas interact differently
  // For now, basic interaction simulation
  
  if (goal.includes('click') || goal.includes('button')) {
    // Try to find and click a button
    const button = await page.locator('button').first();
    if (await button.isVisible()) {
      await button.click();
    }
  } else if (goal.includes('type') || goal.includes('input')) {
    // Try to find and fill an input
    const input = await page.locator('input[type="text"]').first();
    if (await input.isVisible()) {
      await input.fill('Test');
    }
  } else if (goal.includes('scroll') || goal.includes('read')) {
    // Scroll to read more
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
  }
}

/**
 * Extract rendered code (re-export from multi-modal)
 */
async function extractRenderedCode(page) {
  // Re-export from multi-modal.mjs
  const { extractRenderedCode } = await import('./multi-modal.mjs');
  return extractRenderedCode(page);
}

/**
 * Experience page with multiple personas
 * 
 * @param {Page} page - Playwright page object
 * @param {Array} personas - Array of persona configurations
 * @param {Object} options - Experience options
 * @returns {Promise<Array>} Array of experience results
 */
export async function experiencePageWithPersonas(page, personas, options = {}) {
  const experiences = [];

  for (const persona of personas) {
    const experience = await experiencePageAsPersona(page, persona, options);
    experiences.push(experience);
  }

  return experiences;
}

