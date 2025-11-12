/**
 * ai-visual-test
 * 
 * Visual testing utilities using Vision Language Models (VLLM) for multi-modal validation.
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

// Auto-load .env file on module initialization
import { loadEnv } from './load-env.mjs';
loadEnv();

import { VLLMJudge, validateScreenshot as _validateScreenshot } from './judge.mjs';

// Initialize global error handlers (only in Node.js environment)
// Use dynamic import to avoid top-level await (compatibility)
if (typeof process !== 'undefined' && process.on) {
  import('./error-handler.mjs')
    .then(({ initErrorHandlers }) => initErrorHandlers())
    .catch(() => {
      // Silently fail if error handler can't be loaded (e.g., in browser)
    });
}

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
  estimateUncertainty,
  selfConsistencyCheck,
  combineUncertaintySources,
  enhanceWithUncertainty,
  shouldUseSelfConsistency
} from './uncertainty-reducer.mjs';
export {
  buildStructuredFusionPrompt,
  calculateModalityWeights,
  compareFusionStrategies
} from './multi-modal-fusion.mjs';
export {
  aggregateTemporalNotes,
  formatNotesForPrompt,
  calculateCoherenceExported as calculateCoherence
} from './temporal.mjs';
export {
  formatTemporalContext,
  formatTemporalForPrompt,
  formatSingleScaleForPrompt,
  formatMultiScaleForPrompt
} from './temporal-prompt-formatter.mjs';
export {
  TemporalDecisionManager,
  createTemporalDecisionManager
} from './temporal-decision-manager.mjs';

export {
  TemporalPreprocessingManager,
  AdaptiveTemporalProcessor,
  createTemporalPreprocessingManager,
  createAdaptiveTemporalProcessor
} from './temporal-preprocessor.mjs';
export {
  pruneTemporalNotes,
  propagateNotes,
  selectTopWeightedNotes
} from './temporal-note-pruner.mjs';
export {
  calculateAttentionWeight
} from './temporal-decision.mjs';
export {
  detectRenderChanges,
  calculateOptimalFPS,
  detectVisualChanges,
  captureOnRenderChanges,
  captureAdaptiveTemporalScreenshots
} from './render-change-detector.mjs';
export {
  aggregateTemporalNotesAdaptive,
  calculateOptimalWindowSize,
  detectActivityPattern
} from './temporal-adaptive.mjs';
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
export { enableDebug, disableDebug, isDebugEnabled, warn, log, error } from './logger.mjs';
export { ScoreTracker } from './score-tracker.mjs';
export { BatchOptimizer } from './batch-optimizer.mjs';
export { TemporalBatchOptimizer } from './temporal-batch-optimizer.mjs';
export { LatencyAwareBatchOptimizer } from './latency-aware-batch-optimizer.mjs';
export { extractStructuredData } from './data-extractor.mjs';
export { aggregateFeedback, generateRecommendations } from './feedback-aggregator.mjs';
export { compressContext, compressStateHistory } from './context-compressor.mjs';
export { experiencePageAsPersona, experiencePageWithPersonas } from './persona-experience.mjs';
export { ExplanationManager, getExplanationManager } from './explanation-manager.mjs';
export {
  createEnhancedPersona,
  experiencePageWithEnhancedPersona,
  calculatePersonaConsistency,
  calculatePersonaDiversity
} from './persona-enhanced.mjs';
export {
  ExperienceTrace,
  ExperienceTracerManager,
  getTracerManager
} from './experience-tracer.mjs';
export {
  ExperiencePropagationTracker,
  getPropagationTracker,
  trackPropagation
} from './experience-propagation.mjs';
export {
  checkCrossModalConsistency,
  validateExperienceConsistency
} from './cross-modal-consistency.mjs';
export {
  generateDynamicPrompt,
  generatePromptVariations,
  generateInteractionPrompt,
  generateGameplayPrompt
} from './dynamic-prompts.mjs';
export {
  generateGamePrompt,
  createGameGoal,
  createGameGoals
} from './game-goal-prompts.mjs';
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
  retryWithBackoff,
  isRetryableError,
  calculateBackoff,
  enhanceErrorMessage
} from './retry.mjs';
export {
  CostTracker,
  getCostTracker,
  recordCost,
  getCostStats
} from './cost-tracker.mjs';
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
  detectHallucination
} from './hallucination-detector.mjs';
export {
  applyBiasMitigation,
  mitigateBias,
  mitigatePositionBias
} from './bias-mitigation.mjs';
export {
  validateWithResearchEnhancements,
  validateMultipleWithPositionAnalysis,
  validateWithLengthAlignment,
  validateWithExplicitRubric,
  validateWithAllResearchEnhancements
} from './research-enhanced-validation.mjs';
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
  EnsembleJudge,
  createEnsembleJudge
} from './ensemble-judge.mjs';
export {
  HumanValidationManager,
  getHumanValidationManager,
  initHumanValidation
} from './human-validation-manager.mjs';
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
export {
  evaluateWithCounterBalance,
  shouldUseCounterBalance
} from './position-counterbalance.mjs';
export {
  selectFewShotExamples,
  formatFewShotExamples
} from './dynamic-few-shot.mjs';
export {
  spearmanCorrelation,
  pearsonCorrelation,
  calculateRankAgreement
} from './metrics.mjs';
export {
  composeSingleImagePrompt,
  composeComparisonPrompt,
  composeMultiModalPrompt
} from './prompt-composer.mjs';
export {
  testGameplay,
  testBrowserExperience,
  validateWithGoals
} from './convenience.mjs';
export { normalizeValidationResult } from './validation-result-normalizer.mjs';

