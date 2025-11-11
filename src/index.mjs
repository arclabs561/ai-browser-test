/**
 * ai-browser-test
 * 
 * Browser testing utilities using Vision Language Models (VLLM) for multi-modal validation.
 * 
 * Supports:
 * - Browser/Playwright integration
 * - Multi-modal validation (screenshot + HTML + CSS + rendered code)
 * - Persona-based experience testing with human-interpreted time scales
 * - Built-in prompt templates (pluggable)
 * - Context/hooks/encoding (compression, state history, temporal aggregation)
 * 
 * Main entry point - exports all public APIs.
 */

import { VLLMJudge, validateScreenshot as _validateScreenshot } from './judge.mjs';

export { VLLMJudge, _validateScreenshot as validateScreenshot };

/**
 * Extract semantic information from VLLM judgment text
 * 
 * Utility function to parse VLLM responses into structured data.
 * Useful for custom implementations that need to parse judgment text.
 * 
 * @param {string|Object} judgment - Judgment text or object from VLLM
 * @returns {Object} Structured semantic information with score, issues, assessment, reasoning
 */
export function extractSemanticInfo(judgment) {
  // Create a temporary judge instance to access the method
  // This avoids needing to instantiate VLLMJudge with config
  const judge = new VLLMJudge({ enabled: false });
  return judge.extractSemanticInfo(judgment);
}
export { 
  multiModalValidation,
  captureTemporalScreenshots,
  extractRenderedCode,
  multiPerspectiveEvaluation
} from './multi-modal.mjs';
export {
  aggregateTemporalNotes,
  formatNotesForPrompt,
  calculateCoherenceExported as calculateCoherence
} from './temporal.mjs';
export {
  getCached,
  setCached,
  clearCache,
  getCacheStats,
  initCache,
  generateCacheKey
} from './cache.mjs';
export {
  createConfig,
  getProvider,
  getConfig,
  setConfig
} from './config.mjs';
export { loadEnv } from './load-env.mjs';
export { ScoreTracker } from './score-tracker.mjs';
export { BatchOptimizer } from './batch-optimizer.mjs';
export { extractStructuredData } from './data-extractor.mjs';
export { aggregateFeedback, generateRecommendations } from './feedback-aggregator.mjs';
export { compressContext, compressStateHistory } from './context-compressor.mjs';
export { experiencePageAsPersona, experiencePageWithPersonas } from './persona-experience.mjs';
export {
  ExperienceTrace,
  ExperienceTracerManager,
  getTracerManager
} from './experience-tracer.mjs';
export {
  generateDynamicPrompt,
  generatePromptVariations,
  generateInteractionPrompt,
  generateGameplayPrompt
} from './dynamic-prompts.mjs';
export {
  AIBrowserTestError,
  ValidationError,
  CacheError,
  ConfigError,
  ProviderError,
  TimeoutError,
  FileError,
  isAIBrowserTestError,
  isErrorType
} from './errors.mjs';

