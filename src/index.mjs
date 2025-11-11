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
 * @param {string | object} judgment - Judgment text or object from VLLM
 * @returns {import('./index.mjs').SemanticInfo} Structured semantic information with score, issues, assessment, reasoning
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
export {
  DEFAULT_RUBRIC,
  buildRubricPrompt,
  getRubricForTestType
} from './rubrics.mjs';
export {
  detectBias,
  detectPositionBias
} from './bias-detector.mjs';
export {
  comparePair,
  rankBatch
} from './pair-comparison.mjs';
export {
  applyBiasMitigation,
  mitigateBias,
  mitigatePositionBias
} from './bias-mitigation.mjs';
export {
  aggregateMultiScale,
  SequentialDecisionContext,
  humanPerceptionTime
} from './temporal-decision.mjs';
export {
  TIME_SCALES,
  MULTI_SCALE_WINDOWS,
  READING_SPEEDS,
  ATTENTION_MULTIPLIERS,
  COMPLEXITY_MULTIPLIERS,
  CONFIDENCE_THRESHOLDS,
  TIME_BOUNDS,
  CONTENT_THRESHOLDS
} from './temporal-constants.mjs';
export {
  TemporalError,
  PerceptionTimeError,
  SequentialContextError,
  MultiScaleError,
  TemporalBatchError
} from './temporal-errors.mjs';
export {
  createTemporalContext,
  mergeTemporalContext,
  extractTemporalContext
} from './temporal-context.mjs';
export {
  TemporalBatchOptimizer
} from './temporal-batch-optimizer.mjs';
export {
  EnsembleJudge,
  createEnsembleJudge
} from './ensemble-judge.mjs';
export {
  isObject,
  isString,
  isNumber,
  isArray,
  isFunction,
  isPromise,
  isValidationResult,
  isValidationContext,
  isPersona,
  isTemporalNote,
  assertObject,
  assertString,
  assertNonEmptyString,
  assertNumber,
  assertArray,
  assertFunction,
  pick,
  getProperty
} from './type-guards.mjs';

