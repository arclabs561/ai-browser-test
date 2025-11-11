#!/usr/bin/env node
/**
 * Expert Evaluation Scenarios
 * 
 * Tests temporal decision-making on complex, opinionated websites
 * with subtle expert-level considerations:
 * - Typography hierarchy and rhythm
 * - Color theory and palette harmony
 * - Information architecture
 * - Micro-interactions and feedback
 * - Accessibility beyond WCAG minimums
 * - Performance perception
 * - Brand consistency
 * - Content strategy
 */

import { validateScreenshot, humanPerceptionTime, SequentialDecisionContext } from '../src/index.mjs';
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const EXPERT_WEBSITES = [
  {
    id: 'typography-expert',
    name: 'Typography-Focused Site',
    url: 'https://practicaltypography.com',
    expertCriteria: {
      typography: {
        hierarchy: 'Clear visual hierarchy with consistent scale',
        rhythm: 'Vertical rhythm and spacing harmony',
        pairing: 'Font pairing creates visual interest without conflict',
        readability: 'Optimal line length and leading for reading'
      },
      subtle: [
        'Baseline grid alignment',
        'Optical sizing adjustments',
        'Contextual alternates usage',
        'Ligature quality'
      ]
    }
  },
  {
    id: 'color-theory-expert',
    name: 'Color Theory Site',
    url: 'https://color.adobe.com',
    expertCriteria: {
      color: {
        harmony: 'Color palette creates visual harmony',
        contrast: 'Sufficient contrast while maintaining aesthetic',
        accessibility: 'Color-blind friendly while beautiful',
        psychology: 'Colors support brand and content goals'
      },
      subtle: [
        'Color temperature consistency',
        'Saturation balance',
        'Value distribution',
        'Color context sensitivity'
      ]
    }
  },
  {
    id: 'information-architecture',
    name: 'Complex IA Site',
    url: 'https://www.nngroup.com',
    expertCriteria: {
      ia: {
        navigation: 'Clear navigation structure and labeling',
        categorization: 'Logical content organization',
        findability: 'Easy to find information',
        hierarchy: 'Visual and information hierarchy aligned'
      },
      subtle: [
        'Breadcrumb effectiveness',
        'Search functionality quality',
        'Content relationships',
        'Progressive disclosure'
      ]
    }
  },
  {
    id: 'micro-interactions',
    name: 'Micro-Interaction Rich Site',
    url: 'https://stripe.com',
    expertCriteria: {
      interactions: {
        feedback: 'Clear feedback for all user actions',
        transitions: 'Smooth, purposeful animations',
        affordances: 'Clear affordances for interactive elements',
        states: 'All states (hover, active, disabled) are clear'
      },
      subtle: [
        'Animation timing and easing',
        'Loading state quality',
        'Error state clarity',
        'Success state satisfaction'
      ]
    }
  },
  {
    id: 'accessibility-expert',
    name: 'Accessibility Excellence',
    url: 'https://www.w3.org/WAI',
    expertCriteria: {
      accessibility: {
        beyond_wcag: 'Exceeds WCAG AAA requirements',
        inclusive: 'Works for diverse abilities and contexts',
        semantic: 'Semantic HTML and ARIA used correctly',
        keyboard: 'Full keyboard navigation with logical order'
      },
      subtle: [
        'Screen reader announcements',
        'Focus management',
        'Reduced motion support',
        'High contrast mode support'
      ]
    }
  },
  {
    id: 'performance-perception',
    name: 'Performance Perception',
    url: 'https://web.dev',
    expertCriteria: {
      performance: {
        perceived: 'Feels fast even if metrics are average',
        loading: 'Progressive loading and skeleton screens',
        feedback: 'Clear loading indicators',
        optimization: 'Optimized images and assets'
      },
      subtle: [
        'First contentful paint perception',
        'Time to interactive feel',
        'Skeleton screen quality',
        'Progressive enhancement'
      ]
    }
  },
  {
    id: 'brand-consistency',
    name: 'Brand Consistency',
    url: 'https://www.apple.com',
    expertCriteria: {
      brand: {
        voice: 'Consistent brand voice throughout',
        visual: 'Visual identity applied consistently',
        tone: 'Tone matches brand personality',
        experience: 'Experience reinforces brand values'
      },
      subtle: [
        'Typography brand alignment',
        'Color brand alignment',
        'Photography style',
        'Content voice consistency'
      ]
    }
  },
  {
    id: 'content-strategy',
    name: 'Content Strategy Excellence',
    url: 'https://www.smashingmagazine.com',
    expertCriteria: {
      content: {
        clarity: 'Clear, scannable content structure',
        hierarchy: 'Content hierarchy supports scanning',
        relevance: 'Content is relevant and valuable',
        presentation: 'Content presentation enhances readability'
      },
      subtle: [
        'Content chunking',
        'White space usage',
        'Content-to-chrome ratio',
        'Reading flow'
      ]
    }
  }
];

/**
 * Build expert-level evaluation prompt
 */
function buildExpertPrompt(website) {
  const { expertCriteria, subtle } = website;
  
  let prompt = `Evaluate this website from an expert design and UX perspective. Pay attention to subtle, opinionated details that experts notice:\n\n`;
  
  // Main criteria
  for (const [category, criteria] of Object.entries(expertCriteria)) {
    if (typeof criteria === 'object') {
      prompt += `**${category.toUpperCase()}:**\n`;
      for (const [key, description] of Object.entries(criteria)) {
        prompt += `- ${description}\n`;
      }
      prompt += `\n`;
    }
  }
  
  // Subtle considerations
  if (subtle && subtle.length > 0) {
    prompt += `**SUBTLE EXPERT CONSIDERATIONS:**\n`;
    subtle.forEach(item => {
      prompt += `- ${item}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `**EVALUATION APPROACH:**\n`;
  prompt += `- Look beyond basic functionality\n`;
  prompt += `- Notice subtle design decisions\n`;
  prompt += `- Consider expert-level best practices\n`;
  prompt += `- Evaluate opinionated design choices\n`;
  prompt += `- Assess attention to detail\n`;
  prompt += `- Consider how experts would critique this\n\n`;
  
  prompt += `Provide a score (0-10) with detailed reasoning focusing on expert-level considerations.`;
  
  return prompt;
}

/**
 * Capture and evaluate expert scenarios
 */
async function evaluateExpertScenarios() {
  console.log('🎯 Expert Evaluation Scenarios\n');
  console.log('Testing temporal decision-making on complex, opinionated websites\n');
  
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const results = [];
  const sequentialContext = new SequentialDecisionContext({
    maxHistory: 5,
    adaptationEnabled: true
  });
  
  for (let i = 0; i < EXPERT_WEBSITES.length; i++) {
    const website = EXPERT_WEBSITES[i];
    console.log(`\n[${i + 1}/${EXPERT_WEBSITES.length}] ${website.name}`);
    console.log(`URL: ${website.url}`);
    
    try {
      // Navigate with human perception time
      const navigationTime = humanPerceptionTime('page-load', {
        contentLength: 5000, // Estimate for complex sites
        attentionLevel: 'focused',
        actionComplexity: 'complex',
        persona: { name: 'Expert Designer' }
      });
      
      console.log(`⏱️  Navigation time: ${navigationTime}ms`);
      await page.goto(website.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(navigationTime);
      
      // Capture screenshot
      const screenshotPath = join(process.cwd(), 'evaluation', 'screenshots', `${website.id}.png`);
      if (!existsSync(join(process.cwd(), 'evaluation', 'screenshots'))) {
        mkdirSync(join(process.cwd(), 'evaluation', 'screenshots'), { recursive: true });
      }
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      // Build expert prompt
      const prompt = buildExpertPrompt(website);
      
      // Adapt prompt based on sequential context
      const adaptedPrompt = sequentialContext.adaptPrompt(prompt, {
        testType: 'expert-evaluation',
        websiteId: website.id,
        websiteName: website.name
      });
      
      // Evaluate with temporal context
      const result = await validateScreenshot(
        screenshotPath,
        adaptedPrompt,
        {
          testType: 'expert-evaluation',
          viewport: { width: 1920, height: 1080 },
          sequentialContext: sequentialContext.getContext(),
          enableBiasMitigation: true
        }
      );
      
      // Add decision to sequential context
      sequentialContext.addDecision({
        score: result.score,
        issues: result.issues || [],
        assessment: result.assessment,
        reasoning: result.reasoning
      });
      
      results.push({
        website: website.id,
        name: website.name,
        url: website.url,
        score: result.score,
        issues: result.issues,
        assessment: result.assessment,
        reasoning: result.reasoning,
        expertCriteria: website.expertCriteria,
        subtle: website.subtle,
        sequentialContext: sequentialContext.getContext()
      });
      
      console.log(`✅ Score: ${result.score}/10`);
      console.log(`   Issues: ${result.issues?.length || 0}`);
      console.log(`   Assessment: ${result.assessment}`);
      
      // Wait between evaluations (human perception time)
      const waitTime = humanPerceptionTime('evaluation', {
        contentLength: 1000,
        attentionLevel: 'focused',
        actionComplexity: 'complex'
      });
      await page.waitForTimeout(waitTime);
      
    } catch (error) {
      console.error(`❌ Error evaluating ${website.name}:`, error.message);
      results.push({
        website: website.id,
        name: website.name,
        url: website.url,
        error: error.message
      });
    }
  }
  
  await browser.close();
  
  // Save results
  const resultsPath = join(process.cwd(), 'evaluation', 'expert-evaluation-results.json');
  writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: EXPERT_WEBSITES.length,
    results: results,
    sequentialContext: sequentialContext.getContext()
  }, null, 2));
  
  console.log(`\n✅ Expert evaluation complete`);
  console.log(`📊 Results saved to: ${resultsPath}`);
  console.log(`\n📈 Summary:`);
  console.log(`   Total evaluated: ${results.filter(r => r.score !== undefined).length}`);
  console.log(`   Average score: ${(results.filter(r => r.score).reduce((sum, r) => sum + r.score, 0) / results.filter(r => r.score).length).toFixed(1)}/10`);
  console.log(`   Sequential context history: ${sequentialContext.history.length} decisions`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  evaluateExpertScenarios().catch(console.error);
}

export { evaluateExpertScenarios, EXPERT_WEBSITES, buildExpertPrompt };

