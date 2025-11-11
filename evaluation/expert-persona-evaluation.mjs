#!/usr/bin/env node
/**
 * Expert Persona Evaluation
 * 
 * Uses persona-based experience testing with temporal decision-making
 * to evaluate complex websites from expert perspectives:
 * - Typography expert
 * - Color theory expert
 * - Information architecture expert
 * - Accessibility expert
 * - Performance expert
 * - Brand strategist
 */

import { experiencePageAsPersona } from '../src/persona-experience.mjs';
import { aggregateMultiScale, SequentialDecisionContext } from '../src/index.mjs';
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const EXPERT_PERSONAS = [
  {
    name: 'Typography Expert',
    goals: ['Evaluate typography hierarchy', 'Assess font pairing', 'Check vertical rhythm'],
    concerns: ['Baseline grid', 'Optical sizing', 'Readability', 'Type scale'],
    expertise: 'typography',
    attentionLevel: 'focused',
    actionComplexity: 'complex'
  },
  {
    name: 'Color Theory Expert',
    goals: ['Evaluate color harmony', 'Assess palette consistency', 'Check contrast'],
    concerns: ['Color temperature', 'Saturation balance', 'Accessibility', 'Brand alignment'],
    expertise: 'color',
    attentionLevel: 'focused',
    actionComplexity: 'complex'
  },
  {
    name: 'Information Architecture Expert',
    goals: ['Evaluate navigation structure', 'Assess content organization', 'Check findability'],
    concerns: ['Labeling clarity', 'Categorization logic', 'Hierarchy', 'Progressive disclosure'],
    expertise: 'ia',
    attentionLevel: 'focused',
    actionComplexity: 'complex'
  },
  {
    name: 'Accessibility Expert',
    goals: ['Evaluate WCAG compliance', 'Assess inclusive design', 'Check keyboard navigation'],
    concerns: ['Screen reader support', 'Focus management', 'Semantic HTML', 'ARIA usage'],
    expertise: 'accessibility',
    attentionLevel: 'focused',
    actionComplexity: 'complex'
  },
  {
    name: 'Performance Expert',
    goals: ['Evaluate perceived performance', 'Assess loading strategies', 'Check optimization'],
    concerns: ['First contentful paint', 'Time to interactive', 'Progressive loading', 'Asset optimization'],
    expertise: 'performance',
    attentionLevel: 'focused',
    actionComplexity: 'complex'
  },
  {
    name: 'Brand Strategist',
    goals: ['Evaluate brand consistency', 'Assess brand voice', 'Check brand alignment'],
    concerns: ['Visual identity', 'Tone consistency', 'Brand values', 'Experience alignment'],
    expertise: 'brand',
    attentionLevel: 'focused',
    actionComplexity: 'complex'
  }
];

const EXPERT_WEBSITES = [
  {
    id: 'typography-expert',
    url: 'https://practicaltypography.com',
    name: 'Practical Typography'
  },
  {
    id: 'color-theory-expert',
    url: 'https://color.adobe.com',
    name: 'Adobe Color'
  },
  {
    id: 'ia-expert',
    url: 'https://www.nngroup.com',
    name: 'Nielsen Norman Group'
  },
  {
    id: 'accessibility-expert',
    url: 'https://www.w3.org/WAI',
    name: 'W3C WAI'
  },
  {
    id: 'performance-expert',
    url: 'https://web.dev',
    name: 'Web.dev'
  },
  {
    id: 'brand-expert',
    url: 'https://www.apple.com',
    name: 'Apple'
  }
];

/**
 * Build expert evaluation prompt for persona
 */
function buildExpertPersonaPrompt(persona, website) {
  return `You are a ${persona.name} evaluating this website.

Your goals:
${persona.goals.map(g => `- ${g}`).join('\n')}

Your concerns:
${persona.concerns.map(c => `- ${c}`).join('\n')}

Evaluate this website from your expert perspective. Pay attention to:
- Subtle design decisions
- Expert-level best practices
- Opinionated design choices
- Attention to detail
- How well it meets your expert criteria

Provide a detailed evaluation with:
- Score (0-10) based on your expertise
- Specific issues or strengths
- Reasoning from your expert perspective
- Recommendations for improvement`;
}

/**
 * Evaluate websites with expert personas
 */
async function evaluateWithExpertPersonas() {
  console.log('🎯 Expert Persona Evaluation\n');
  console.log('Using temporal decision-making with expert personas\n');
  
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const allResults = [];
  const sequentialContext = new SequentialDecisionContext({
    maxHistory: 10,
    adaptationEnabled: true
  });
  
  for (let i = 0; i < EXPERT_WEBSITES.length; i++) {
    const website = EXPERT_WEBSITES[i];
    console.log(`\n[${i + 1}/${EXPERT_WEBSITES.length}] ${website.name}`);
    console.log(`URL: ${website.url}`);
    
    // Find matching persona
    const persona = EXPERT_PERSONAS.find(p => 
      website.id.includes(p.expertise) || 
      website.name.toLowerCase().includes(p.expertise)
    ) || EXPERT_PERSONAS[0];
    
    console.log(`👤 Persona: ${persona.name}`);
    
    try {
      // Navigate
      await page.goto(website.url, { waitUntil: 'networkidle' });
      
      // Build expert prompt
      const expertPrompt = buildExpertPersonaPrompt(persona, website);
      
      // Experience page as expert persona
      const result = await experiencePageAsPersona(
        page,
        {
          ...persona,
          prompt: expertPrompt
        },
        {
          sequentialContext: sequentialContext.getContext(),
          enableBiasMitigation: true,
          attentionLevel: persona.attentionLevel,
          actionComplexity: persona.actionComplexity
        }
      );
      
      // Aggregate temporal notes using multi-scale aggregation
      const aggregated = aggregateMultiScale(result.notes || [], {
        timeScales: {
          immediate: 100,   // 0.1s - instant reactions
          short: 1000,      // 1s - quick assessments
          medium: 10000,    // 10s - detailed evaluation
          long: 60000       // 60s - comprehensive review
        },
        attentionWeights: true
      });
      
      // experiencePageAsPersona returns notes, screenshots, and optionally evaluation
      // Use the evaluation if present, otherwise run validateScreenshot on final screenshot
      let evaluation = result.evaluation || null;
      
      if (!evaluation && result.screenshots && result.screenshots.length > 0) {
        const finalScreenshot = result.screenshots[result.screenshots.length - 1];
        
        // Run expert evaluation on final screenshot
        evaluation = await validateScreenshot(
          finalScreenshot.path,
          expertPrompt,
          {
            testType: 'expert-persona-evaluation',
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
      
      allResults.push({
        website: website.id,
        name: website.name,
        url: website.url,
        persona: persona.name,
        expertise: persona.expertise,
        evaluation: evaluation, // Use the evaluation we ran
        notes: result.notes,
        aggregated: aggregated,
        screenshots: result.screenshots,
        sequentialContext: sequentialContext.getContext()
      });
      
      console.log(`✅ Evaluation complete`);
      if (evaluation) {
        console.log(`   Score: ${evaluation.score}/10`);
        console.log(`   Issues: ${evaluation.issues?.length || 0}`);
      }
      console.log(`   Notes: ${result.notes?.length || 0}`);
      console.log(`   Temporal scales: ${Object.keys(aggregated.scales || {}).length}`);
      
    } catch (error) {
      console.error(`❌ Error evaluating ${website.name}:`, error.message);
      allResults.push({
        website: website.id,
        name: website.name,
        url: website.url,
        persona: persona.name,
        error: error.message
      });
    }
  }
  
  await browser.close();
  
  // Save results
  const resultsPath = join(process.cwd(), 'evaluation', 'expert-persona-results.json');
  writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: EXPERT_WEBSITES.length,
    personas: EXPERT_PERSONAS.length,
    results: allResults,
    sequentialContext: sequentialContext.getContext()
  }, null, 2));
  
  console.log(`\n✅ Expert persona evaluation complete`);
  console.log(`📊 Results saved to: ${resultsPath}`);
  console.log(`\n📈 Summary:`);
  console.log(`   Websites evaluated: ${allResults.filter(r => r.evaluation).length}`);
  console.log(`   Personas used: ${EXPERT_PERSONAS.length}`);
  console.log(`   Sequential context history: ${sequentialContext.history.length} decisions`);
  
  return allResults;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  evaluateWithExpertPersonas().catch(console.error);
}

export { evaluateWithExpertPersonas, EXPERT_PERSONAS, EXPERT_WEBSITES };

