/**
 * TypeScript definitions for ai-visual-test
 * 
 * Provides type safety and IntelliSense support for the package.
 */

// Utility Types
/**
 * Make specific properties optional
 * @template T
 * @template K
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 * @template T
 * @template K
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract return type from a function
 * @template T
 */
export type ReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : never;

/**
 * Extract parameter types from a function
 * @template T
 */
export type Parameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;

/**
 * Deep partial - makes all nested properties optional
 * @template T
 */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/**
 * Deep required - makes all nested properties required
 * @template T
 */
export type DeepRequired<T> = T extends object ? { [P in keyof T]-?: DeepRequired<T[P]> } : T;

/**
 * Non-nullable - removes null and undefined from type
 * @template T
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Function type for validation functions
 * @template T
 */
export type ValidationFunction<T = ValidationResult> = (
  imagePath: string,
  prompt: string,
  context?: ValidationContext
) => Promise<T>;

// Error Types
export class AIBrowserTestError extends Error {
  code: string;
  details: Record<string, unknown>;
  constructor(message: string, code: string, details?: Record<string, unknown>);
  toJSON(): {
    name: string;
    code: string;
    message: string;
    details: Record<string, unknown>;
    stack?: string;
  };
}

export class ValidationError extends AIBrowserTestError {
  constructor(message: string, details?: Record<string, unknown>);
}

export class CacheError extends AIBrowserTestError {
  constructor(message: string, details?: Record<string, unknown>);
}

export class ConfigError extends AIBrowserTestError {
  constructor(message: string, details?: Record<string, unknown>);
}

export class ProviderError extends AIBrowserTestError {
  provider: string;
  constructor(message: string, provider: string, details?: Record<string, unknown>);
}

export class TimeoutError extends AIBrowserTestError {
  timeout: number;
  constructor(message: string, timeout: number, details?: Record<string, unknown>);
}

export class FileError extends AIBrowserTestError {
  filePath: string;
  constructor(message: string, filePath: string, details?: Record<string, unknown>);
}

export function isAIBrowserTestError(error: unknown): error is AIBrowserTestError;
export function isErrorType<T extends AIBrowserTestError>(error: unknown, errorClass: new (...args: any[]) => T): error is T;

// Rubrics
export interface Rubric {
  score: {
    description: string;
    criteria: Record<string, string>;
  };
  dimensions?: Record<string, {
    description: string;
    criteria: string[];
  }>;
}

export const DEFAULT_RUBRIC: Rubric;
export function buildRubricPrompt(rubric?: Rubric | null, includeDimensions?: boolean): string;
export function getRubricForTestType(testType: string): Rubric;

// Bias Detection
export interface BiasDetectionResult {
  hasBias: boolean;
  biases: Array<{
    type: string;
    detected: boolean;
    score: number;
    evidence: Record<string, unknown>;
  }>;
  severity: 'none' | 'low' | 'medium' | 'high';
  recommendations: string[];
}

export function detectBias(judgment: string | object, options?: {
  checkVerbosity?: boolean;
  checkLength?: boolean;
  checkFormatting?: boolean;
  checkPosition?: boolean;
  checkAuthority?: boolean;
}): BiasDetectionResult;

export interface PositionBiasResult {
  detected: boolean;
  firstBias?: boolean;
  lastBias?: boolean;
  reason?: string;
  evidence?: {
    firstScore: number;
    lastScore: number;
    avgMiddle: number;
    allScores: number[];
  };
}

export function detectPositionBias(judgments: Array<{ score: number | null }>): PositionBiasResult;

// Ensemble Judging
export interface EnsembleJudgeOptions {
  judges?: Array<VLLMJudge>;
  votingMethod?: 'weighted_average' | 'majority' | 'consensus';
  weights?: number[];
  minAgreement?: number;
  enableBiasDetection?: boolean;
}

export interface EnsembleResult {
  score: number | null;
  assessment: string;
  issues: string[];
  reasoning: string;
  confidence: number;
  agreement: {
    score: number;
    scoreAgreement: number;
    assessmentAgreement: number;
    mean: number;
    stdDev: number;
    scores: number[];
  };
  disagreement: {
    hasDisagreement: boolean;
    scoreRange: number;
    assessmentDisagreement: boolean;
    uniqueAssessments: string[];
    maxScore: number;
    minScore: number;
  };
  biasDetection?: {
    individual: BiasDetectionResult[];
    position: PositionBiasResult;
  };
  individualJudgments: Array<{
    judgeIndex: number;
    score: number | null;
    assessment: string | null;
    issues: string[];
    reasoning: string | null;
    provider: string;
    error?: string;
  }>;
  judgeCount: number;
  votingMethod: string;
}

export class EnsembleJudge {
  constructor(options?: EnsembleJudgeOptions);
  evaluate(imagePath: string, prompt: string, context?: Record<string, unknown>): Promise<EnsembleResult>;
}

export function createEnsembleJudge(providers?: string[], options?: EnsembleJudgeOptions): EnsembleJudge;

// Core Types
export interface ValidationContext {
  testType?: string;
  viewport?: { width: number; height: number };
  gameState?: Record<string, unknown>;
  useCache?: boolean;
  timeout?: number;
  useRubric?: boolean;
  includeDimensions?: boolean;
  url?: string;
  description?: string;
  step?: string;
  promptBuilder?: (prompt: string, context: ValidationContext) => string;
}

export interface EstimatedCost {
  inputTokens: number;
  outputTokens: number;
  inputCost: string;
  outputCost: string;
  totalCost: string;
  currency: string;
}

export interface SemanticInfo {
  score: number | null;
  issues: string[];
  assessment: string | null;
  reasoning: string;
  brutalistViolations?: string[];
  zeroToleranceViolations?: string[];
}

export interface ValidationResult {
  enabled: boolean;
  provider: string;
  score: number | null;
  issues: string[];
  assessment: string | null;
  reasoning: string;
  estimatedCost?: EstimatedCost | null;
  responseTime: number;
  cached?: boolean;
  judgment?: string;
  raw?: unknown;
  semantic?: SemanticInfo;
  error?: string;
  message?: string;
  pricing?: { input: number; output: number };
  timestamp?: string;
  testName?: string;
  viewport?: { width: number; height: number } | null;
}

export interface ConfigOptions {
  provider?: 'gemini' | 'openai' | 'claude' | null;
  apiKey?: string | null;
  env?: NodeJS.ProcessEnv;
  cacheDir?: string | null;
  cacheEnabled?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  verbose?: boolean;
}

export interface Config {
  provider: string;
  apiKey: string | null;
  providerConfig: {
    name: string;
    apiUrl: string;
    model: string;
    freeTier: boolean;
    pricing: { input: number; output: number };
    priority: number;
  };
  enabled: boolean;
  cache: {
    enabled: boolean;
    dir: string | null;
  };
  performance: {
    maxConcurrency: number;
    timeout: number;
  };
  debug: {
    verbose: boolean;
  };
}

// VLLMJudge Class
export class VLLMJudge {
  constructor(options?: ConfigOptions);
  provider: string;
  apiKey: string | null;
  providerConfig: Config['providerConfig'];
  enabled: boolean;
  
  imageToBase64(imagePath: string): string;
  buildPrompt(prompt: string, context: ValidationContext): string;
  extractSemanticInfo(judgment: string | object): SemanticInfo;
  estimateCost(data: unknown, provider: string): EstimatedCost | null;
  judgeScreenshot(imagePath: string, prompt: string, context?: ValidationContext): Promise<ValidationResult>;
}

// Core Functions
export function validateScreenshot(
  imagePath: string,
  prompt: string,
  context?: ValidationContext
): Promise<ValidationResult>;

export function extractSemanticInfo(judgment: string | object): SemanticInfo;

// Multi-Modal Types
export interface RenderedCode {
  html: string;
  criticalCSS: Record<string, Record<string, string>>;
  domStructure: {
    prideParade?: {
      computedTop: string;
      flagRowCount: number;
    };
    footer?: {
      computedBottom: string;
      hasStripe: boolean;
    };
    paymentCode?: {
      visible: boolean;
    };
  };
}

export interface TemporalScreenshot {
  path: string;
  timestamp: number;
  elapsed: number;
}

export interface Persona {
  name: string;
  perspective: string;
  focus: string[];
}

export interface PerspectiveEvaluation {
  persona: Persona;
  evaluation: ValidationResult;
}

// Multi-Modal Functions
export function extractRenderedCode(page: any): Promise<RenderedCode>;
export function captureTemporalScreenshots(
  page: any,
  fps?: number,
  duration?: number
): Promise<TemporalScreenshot[]>;
export function multiPerspectiveEvaluation(
  validateFn: ValidationFunction,
  screenshotPath: string,
  renderedCode: RenderedCode,
  gameState?: Record<string, unknown>,
  personas?: Persona[] | null
): Promise<PerspectiveEvaluation[]>;
export function multiModalValidation(
  validateFn: ValidationFunction,
  page: any,
  testName: string,
  options?: {
    fps?: number;
    duration?: number;
    captureCode?: boolean;
    captureState?: boolean;
    multiPerspective?: boolean;
  }
): Promise<{
  screenshotPath: string;
  renderedCode: RenderedCode | null;
  gameState: Record<string, unknown>;
  temporalScreenshots: TemporalScreenshot[];
  perspectives: PerspectiveEvaluation[];
  codeValidation: Record<string, boolean>;
  aggregatedScore: number | null;
  aggregatedIssues: string[];
  timestamp: number;
}>;

// Temporal Types
export interface TemporalNote {
  timestamp?: number;
  elapsed?: number;
  score?: number;
  observation?: string;
  step?: string;
}

export interface TemporalWindow {
  index: number;
  startTime: number;
  endTime: number;
  notes: TemporalNote[];
  weightedScore: number;
  totalWeight: number;
  avgScore: number;
  observations: Set<string>;
}

export interface AggregatedTemporalNotes {
  windows: TemporalWindow[];
  summary: string;
  coherence: number;
  conflicts: Array<{
    window1: number;
    window2: number;
    type: string;
    description: string;
  }>;
}

// Temporal Functions
export function aggregateTemporalNotes(
  notes: TemporalNote[],
  options?: {
    windowSize?: number;
    decayFactor?: number;
    coherenceThreshold?: number;
  }
): AggregatedTemporalNotes;

export function formatNotesForPrompt(aggregated: AggregatedTemporalNotes): string;

export function calculateCoherence(windows: TemporalWindow[]): number;

// Cache Types
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// Cache Functions
export function initCache(cacheDir?: string): void;
export function generateCacheKey(imagePath: string, prompt: string, context?: ValidationContext): string;
export function getCached(imagePath: string, prompt: string, context?: ValidationContext): ValidationResult | null;
export function setCached(
  imagePath: string,
  prompt: string,
  context: ValidationContext,
  result: ValidationResult
): void;
export function clearCache(): void;
export function getCacheStats(): CacheStats;

// Config Functions
export function createConfig(options?: ConfigOptions): Config;
export function getConfig(): Config;
export function setConfig(config: Config): void;
export function getProvider(providerName?: string | null): Config['providerConfig'];

// Utility Functions
export function loadEnv(basePath?: string | null): void;

// ScoreTracker Class
export class ScoreTracker {
  constructor(options?: { baselineDir?: string; autoSave?: boolean });
  record(testName: string, score: number, metadata?: Record<string, unknown>): { score: number; timestamp: string; metadata: Record<string, unknown> };
  getBaseline(testName: string): number | null;
  getCurrent(testName: string): number | null;
  compare(testName: string, currentScore: number): { hasBaseline: boolean; baseline: number | null; current: number; improved: boolean; delta: number; percentage: number; regression?: boolean; trend?: string; history?: Array<{ score: number; timestamp: string; metadata?: Record<string, unknown> }> } | null;
  updateBaseline(testName: string, newBaseline?: number | null): boolean;
  getAll(): Record<string, { history: Array<{ score: number; timestamp: string; metadata?: Record<string, unknown> }>; current: number | null; baseline: number | null; firstRecorded: string; lastUpdated: string; baselineSetAt?: string }>;
  getStats(): {
    current: number | null;
    baseline: number | null;
    history: Array<{ score: number; timestamp: number; metadata?: Record<string, unknown> }>;
    average: number | null;
    min: number | null;
    max: number | null;
    totalTests?: number;
    testsWithBaselines?: number;
    testsWithRegressions?: number;
    testsWithImprovements?: number;
    averageScore?: number;
    averageBaseline?: number;
  };
}

// BatchOptimizer Class
export class BatchOptimizer {
  constructor(options?: { maxConcurrency?: number; batchSize?: number; cacheEnabled?: boolean });
  batchValidate(imagePaths: string | string[], prompt: string, context?: ValidationContext): Promise<ValidationResult[]>;
  clearCache(): void;
  getCacheStats(): { cacheSize: number; queueLength: number; activeRequests: number };
}

// Data Extractor
export function extractStructuredData(
  text: string,
  schema: object,
  options?: {
    method?: 'json' | 'llm' | 'regex';
    provider?: string;
    apiKey?: string;
  }
): Promise<unknown>;

// Feedback Aggregator
export interface AggregatedFeedback {
  averageScore: number;
  totalIssues: number;
  commonIssues: Array<{ issue: string; count: number }>;
  scoreDistribution: Record<string, number>;
  recommendations: string[];
}

export function aggregateFeedback(judgeResults: ValidationResult[]): AggregatedFeedback;
export function generateRecommendations(aggregated: AggregatedFeedback): string[];

// Context Compressor
export function compressContext(
  notes: TemporalNote[],
  options?: {
    maxLength?: number;
    preserveImportant?: boolean;
  }
): TemporalNote[];

export function compressStateHistory(
  stateHistory: Array<Record<string, unknown>>,
  options?: {
    maxLength?: number;
    preserveImportant?: boolean;
  }
): Array<Record<string, unknown>>;

// Persona Experience
export interface PersonaExperienceOptions {
  viewport?: { width: number; height: number };
  device?: string;
  darkMode?: boolean;
  timeScale?: 'human' | 'mechanical';
  captureScreenshots?: boolean;
  captureState?: boolean;
  captureCode?: boolean;
  notes?: TemporalNote[];
}

export interface PersonaExperienceResult {
  persona: Persona;
  notes: TemporalNote[];
  screenshots: TemporalScreenshot[];
  renderedCode?: RenderedCode;
  gameState?: Record<string, unknown>;
  evaluation?: ValidationResult;
  timestamp: number;
}

export function experiencePageAsPersona(
  page: any,
  persona: Persona,
  options?: PersonaExperienceOptions
): Promise<PersonaExperienceResult>;

export function experiencePageWithPersonas(
  page: any,
  personas: Persona[],
  options?: PersonaExperienceOptions
): Promise<PersonaExperienceResult[]>;

// Type Guards
export function isObject<T>(value: unknown): value is Record<string, T>;
export function isString(value: unknown): value is string;
export function isNumber(value: unknown): value is number;
export function isPositiveInteger(value: unknown): value is number;
export function isNonEmptyString(value: unknown): value is string;
export function isArray<T>(value: unknown): value is T[];
export function isFunction(value: unknown): value is Function;
export function isPromise<T>(value: unknown): value is Promise<T>;
export function isValidationResult(value: unknown): value is ValidationResult;
export function isValidationContext(value: unknown): value is ValidationContext;
export function isPersona(value: unknown): value is Persona;
export function isTemporalNote(value: unknown): value is TemporalNote;

// Type Assertions
export function assertObject<T>(value: unknown, name?: string): asserts value is Record<string, T>;
export function assertString(value: unknown, name?: string): asserts value is string;
export function assertNonEmptyString(value: unknown, name?: string): asserts value is string;
export function assertNumber(value: unknown, name?: string): asserts value is number;
export function assertArray<T>(value: unknown, name?: string): asserts value is T[];
export function assertFunction(value: unknown, name?: string): asserts value is Function;

// Utility Functions
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
export function getProperty<T, D>(obj: T, key: string, defaultValue: D): T[keyof T] | D;

// Experience Tracer
export class ExperienceTrace {
  constructor(sessionId: string, persona?: Persona | null);
  sessionId: string;
  persona: Persona | null;
  startTime: number;
  events: Array<Record<string, unknown>>;
  validations: Array<Record<string, unknown>>;
  screenshots: Array<Record<string, unknown>>;
  stateHistory: Array<Record<string, unknown>>;
  aggregatedNotes: AggregatedTemporalNotes | null;
  metaEvaluation: Record<string, unknown> | null;
  
  addEvent(type: string, data: Record<string, unknown>, timestamp?: number | null): Record<string, unknown>;
  addValidation(validation: ValidationResult, context?: Record<string, unknown>): Record<string, unknown>;
  addScreenshot(path: string, step: string, metadata?: Record<string, unknown>): Record<string, unknown>;
  addStateSnapshot(state: Record<string, unknown>, label?: string): Record<string, unknown>;
  aggregateNotes(
    aggregateTemporalNotes: (notes: TemporalNote[], options?: Record<string, unknown>) => AggregatedTemporalNotes,
    options?: Record<string, unknown>
  ): AggregatedTemporalNotes;
  getSummary(): Record<string, unknown>;
  getFullTrace(): Record<string, unknown>;
  exportToJSON(filePath: string): Promise<void>;
}

export class ExperienceTracerManager {
  constructor();
  createTrace(sessionId: string, persona?: Persona | null): ExperienceTrace;
  getTrace(sessionId: string): ExperienceTrace | null;
  getAllTraces(): ExperienceTrace[];
  metaEvaluateTrace(
    sessionId: string,
    validateScreenshot: ValidationFunction
  ): Promise<Record<string, unknown>>;
  getMetaEvaluationSummary(): {
    totalEvaluations: number;
    averageQuality: number | null;
    evaluations?: Array<Record<string, unknown>>;
  };
}

export function getTracerManager(): ExperienceTracerManager;

// Position Counter-Balance
export interface CounterBalanceOptions {
  enabled?: boolean;
  baselinePath?: string | null;
  contextOrder?: 'original' | 'reversed';
}

export interface CounterBalancedResult extends ValidationResult {
  counterBalanced: boolean;
  originalScore: number | null;
  reversedScore: number | null;
  scoreDifference: number | null;
  metadata: {
    counterBalancing: {
      enabled: boolean;
      originalResult: ValidationResult;
      reversedResult: ValidationResult;
      positionBiasDetected: boolean;
    };
  };
}

export function evaluateWithCounterBalance(
  evaluateFn: ValidationFunction<ValidationResult>,
  imagePath: string,
  prompt: string,
  context?: ValidationContext,
  options?: CounterBalanceOptions
): Promise<CounterBalancedResult>;

export function shouldUseCounterBalance(context: ValidationContext): boolean;

// Dynamic Few-Shot Examples
export interface FewShotExample {
  description?: string;
  evaluation?: string;
  score?: number | null;
  screenshot?: string;
  quality?: string;
  result?: {
    score?: number | null;
    reasoning?: string;
  };
  json?: unknown;
}

export interface FewShotOptions {
  maxExamples?: number;
  similarityThreshold?: number;
  useSemanticMatching?: boolean;
}

export function selectFewShotExamples(
  prompt: string,
  examples?: FewShotExample[],
  options?: FewShotOptions
): FewShotExample[];

export function formatFewShotExamples(
  examples: FewShotExample[],
  format?: 'default' | 'json'
): string;

// Metrics
export function spearmanCorrelation(
  x: Array<number | null>,
  y: Array<number | null>
): number | null;

export function pearsonCorrelation(
  x: Array<number | null>,
  y: Array<number | null>
): number | null;

export interface RankAgreementResult {
  spearman: number | null;
  pearson: number | null;
  kendall: number | null;
  exactMatches: number;
  totalItems: number;
  agreementRate: number;
}

export function calculateRankAgreement(
  ranking1: Array<number | null>,
  ranking2: Array<number | null>
): RankAgreementResult;



