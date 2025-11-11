#!/usr/bin/env node
/**
 * Evaluate Interactive Experiences
 * 
 * Tests interactive websites using persona-based experience testing
 * and temporal decision-making.
 */

import { experiencePageAsPersona, aggregateMultiScale, SequentialDecisionContext } from '../src/index.mjs';
import { INTERACTIVE_EXPERIENCE_WEBSITES, getAllInteractiveWebsitesSorted, buildInteractivePrompt } from './interactive-experiences.mjs';
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const RESULTS_DIR = join(process.cwd(), 'evaluation', 'results');
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Create personas for interactive testing
 */
function createInteractivePersonas() {
  return [
    {
      name: 'Casual Gamer',
      goals: ['play game', 'understand controls', 'enjoy experience'],
      concerns: ['ease of use', 'clear feedback', 'fun factor'],
      device: 'desktop',
      attentionLevel: 'normal'
    },
    {
      name: 'Accessibility Advocate',
      goals: ['navigate with keyboard', 'use screen reader', 'understand all content'],
      concerns: ['keyboard navigation', 'screen reader support', 'ARIA labels'],
      device: 'desktop',
      attentionLevel: 'focused'
    },
    {
      name: 'Power User',
      goals: ['use shortcuts', 'efficient navigation', 'advanced features'],
      concerns: ['keyboard shortcuts', 'efficiency', 'advanced controls'],
      device: 'desktop',
      attentionLevel: 'focused'
    },
    {
      name: 'Keyboard User',
      goals: ['navigate without mouse', 'use all features', 'understand focus'],
      concerns: ['keyboard-only navigation', 'focus indicators', 'tab order'],
      device: 'desktop',
      attentionLevel: 'focused'
    },
    {
      name: 'Screen Reader User',
      goals: ['understand content', 'navigate efficiently', 'use all features'],
      concerns: ['semantic HTML', 'ARIA labels', 'screen reader announcements'],
      device: 'desktop',
      attentionLevel: 'focused'
    }
  ];
}

/**
 * Evaluate interactive website with personas
 */
export async function evaluateInteractiveWebsite(website, options = {}) {
  const { personas = createInteractivePersonas(), limitPersonas = null } = options;
  
  console.log(`\n🎮 Evaluating: ${website.name} (${website.experienceType})\n`);
  
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const results = {
    website: website.id,
    name: website.name,
    url: website.url,
    experienceType: website.experienceType,
    difficulty: website.difficulty,
    personaResults: []
  };
  
  // Select personas (use website's personas if specified, otherwise use all)
  const selectedPersonas = website.personas 
    ? personas.filter(p => website.personas.includes(p.name))
    : (limitPersonas ? personas.slice(0, limitPersonas) : personas);
  
  const sequentialContext = new SequentialDecisionContext({
    maxHistory: 10,
    adaptationEnabled: true
  });
  
  for (const persona of selectedPersonas) {
    console.log(`   👤 Testing as: ${persona.name}`);
    
    try {
      // Navigate
      await page.goto(website.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Build interactive prompt
      const basePrompt = buildInteractivePrompt(website);
      const personaPrompt = `${basePrompt}\n\nYou are evaluating this as ${persona.name}. Your goals: ${persona.goals.join(', ')}. Your concerns: ${persona.concerns.join(', ')}.`;
      
      // Experience page as persona
      const experienceResult = await experiencePageAsPersona(
        page,
        {
          ...persona,
          prompt: personaPrompt
        },
        {
          url: website.url,
          sequentialContext: sequentialContext.getContext(),
          enableBiasMitigation: true,
          attentionLevel: persona.attentionLevel || 'normal'
        }
      );
      
      // Aggregate temporal notes
      const aggregated = aggregateMultiScale(experienceResult.notes || [], {
        timeScales: {
          immediate: 100,   // 0.1s - instant reactions
          short: 1000,      // 1s - quick assessments
          medium: 10000,    // 10s - detailed evaluation
          long: 60000       // 60s - comprehensive review
        },
        attentionWeights: true
      });
      
      // Get final evaluation
      let evaluation = experienceResult.evaluation;
      if (!evaluation && experienceResult.screenshots && experienceResult.screenshots.length > 0) {
        const { validateScreenshot } = await import('../src/index.mjs');
        const finalScreenshot = experienceResult.screenshots[experienceResult.screenshots.length - 1];
        evaluation = await validateScreenshot(
          finalScreenshot.path,
          personaPrompt,
          {
            testType: 'interactive-experience',
            viewport: { width: 1920, height: 1080 },
            sequentialContext: sequentialContext.getContext(),
            enableBiasMitigation: true
          }
        );
      }
      
      // Add decision to sequential context
      if (evaluation && evaluation.score !== null) {
        sequentialContext.addDecision({
          score: evaluation.score,
          issues: evaluation.issues || [],
          assessment: evaluation.assessment,
          reasoning: evaluation.reasoning
        });
      }
      
      results.personaResults.push({
        persona: persona.name,
        evaluation: evaluation,
        notes: experienceResult.notes,
        aggregated: aggregated,
        screenshots: experienceResult.screenshots
      });
      
      console.log(`      ✅ Score: ${evaluation?.score || 'N/A'}/10`);
      console.log(`      📝 Notes: ${experienceResult.notes?.length || 0}`);
      
    } catch (error) {
      console.error(`      ❌ Error: ${error.message}`);
      results.personaResults.push({
        persona: persona.name,
        error: error.message
      });
    }
  }
  
  await browser.close();
  
  return results;
}

/**
 * Evaluate all interactive experiences
 */
export async function evaluateAllInteractiveExperiences(options = {}) {
  const { limit = null, experienceType = null, difficulty = null } = options;
  
  console.log('🎮 Interactive Experience Evaluation\n');
  console.log('Testing interactive websites with persona-based experience testing\n');
  
  let websites = getAllInteractiveWebsitesSorted();
  
  if (experienceType) {
    websites = websites.filter(w => w.experienceType === experienceType);
  }
  
  if (difficulty) {
    websites = websites.filter(w => w.difficulty === difficulty);
  }
  
  if (limit) {
    websites = websites.slice(0, limit);
  }
  
  console.log(`Found ${websites.length} interactive websites to evaluate\n`);
  
  const allResults = [];
  
  for (let i = 0; i < websites.length; i++) {
    const website = websites[i];
    console.log(`[${i + 1}/${websites.length}] ${website.name}`);
    
    try {
      const result = await evaluateInteractiveWebsite(website, options);
      allResults.push(result);
    } catch (error) {
      console.error(`❌ Error evaluating ${website.name}: ${error.message}`);
      allResults.push({
        website: website.id,
        name: website.name,
        error: error.message
      });
    }
  }
  
  // Save results
  const resultsPath = join(RESULTS_DIR, `interactive-experiences-${Date.now()}.json`);
  writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: websites.length,
    results: allResults
  }, null, 2));
  
  console.log(`\n✅ Interactive experience evaluation complete`);
  console.log(`📊 Results saved to: ${resultsPath}`);
  
  // Summary
  console.log(`\n📈 Summary:`);
  console.log(`   Websites evaluated: ${allResults.filter(r => r.personaResults).length}`);
  console.log(`   Total persona evaluations: ${allResults.reduce((sum, r) => sum + (r.personaResults?.length || 0), 0)}`);
  
  return allResults;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  evaluateAllInteractiveExperiences().catch(console.error);
}

export { evaluateInteractiveWebsite, evaluateAllInteractiveExperiences, createInteractivePersonas };





