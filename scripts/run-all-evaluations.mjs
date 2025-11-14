#!/usr/bin/env node
/**
 * Run All Evaluations
 * 
 * Runs all evaluation scripts with proper .env API key loading.
 * 
 * Evaluations:
 * 1. Spec validation (natural language specs)
 * 2. Comprehensive evaluation (all methods comparison)
 * 3. Challenging tests (edge cases)
 * 4. LLM vs regex comparison
 * 5. Research features validation
 */

import { loadEnv } from '../src/load-env.mjs';
import { join } from 'path';
import { existsSync } from 'fs';

// Load .env for API keys
loadEnv();

console.log('🔬 Running All Evaluations\n');
console.log('API Keys Status:');
console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅' : '❌'}`);
console.log(`  GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅' : '❌'}`);
console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅' : '❌'}`);
console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅' : '❌'}\n`);

const evaluations = [
  {
    name: 'Spec Validation',
    script: 'evaluation/runners/run-spec-validation.mjs',
    description: 'Validates natural language specs against dataset'
  },
  {
    name: 'Comprehensive Evaluation',
    script: 'evaluation/runners/comprehensive-evaluation.mjs',
    description: 'Compares all validation methods on real dataset'
  },
  {
    name: 'Challenging Tests',
    script: 'evaluation/runners/run-challenging-tests.mjs',
    description: 'Tests edge cases and challenging scenarios'
  },
  {
    name: 'LLM vs Regex Comparison',
    script: 'test/llm-vs-regex-comparison.test.mjs',
    description: 'Compares LLM vs regex extraction accuracy',
    isTest: true
  },
  {
    name: 'Research Features Validation',
    script: 'test/research-features-validation.test.mjs',
    description: 'Validates research features actually work',
    isTest: true
  },
  {
    name: 'Dataset Evaluations',
    script: 'evaluation/runners/run-dataset-evaluations.mjs',
    description: 'Evaluations using real downloaded datasets (WebUI, WCAG)',
    isTest: false
  }
];

async function runEvaluation(evalConfig) {
  console.log(`\n📊 ${evalConfig.name}`);
  console.log(`   ${evalConfig.description}`);
  
  const scriptPath = join(process.cwd(), evalConfig.script);
  
  if (!existsSync(scriptPath)) {
    console.log(`   ⚠️  Script not found: ${scriptPath}`);
    return { success: false, error: 'Script not found' };
  }
  
  try {
    if (evalConfig.isTest) {
      // Run as test using node --test directly
      const { execSync } = await import('child_process');
      const output = execSync(`node --test ${evalConfig.script}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log(`   ✅ Completed`);
      return { success: true, output };
    } else {
      // Run as script
      const module = await import(`file://${scriptPath}`);
      if (module.default) {
        await module.default();
      }
      console.log(`   ✅ Completed`);
      return { success: true };
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllEvaluations() {
  const results = [];
  
  for (const evalConfig of evaluations) {
    const result = await runEvaluation(evalConfig);
    results.push({
      name: evalConfig.name,
      ...result
    });
  }
  
  console.log('\n📋 Evaluation Summary:');
  console.log(`   Total: ${results.length}`);
  console.log(`   Successful: ${results.filter(r => r.success).length}`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}`);
  
  if (results.some(r => !r.success)) {
    console.log('\n❌ Failed Evaluations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error || 'Unknown error'}`);
    });
  }
  
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllEvaluations().catch(error => {
    console.error('❌ Evaluation runner failed:', error);
    process.exit(1);
  });
}

export { runAllEvaluations };

