/**
 * TypeScript definitions for ai-browser-test
 * 
 * Provides type safety and IntelliSense support for the package.
 */

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

// Core Types
export interface ValidationContext {
  testType?: string;
  viewport?: { width: number; height: number };
  gameState?: Record<string, unknown>;
  useCache?: boolean;
  timeout?: number;
  promptBuilder?: (prompt: string, context: ValidationContext) => string;
}

export interface ValidationResult {
  enabled: boolean;
  provider: string;
  score: number | null;
  issues: string[];
  assessment: string | null;
  reasoning: string;
  estimatedCost?: {
    inputTokens: number;
    outputTokens: number;
    inputCost: string;
    outputCost: string;
    totalCost: string;
    currency: string;
  } | null;
  responseTime: number;
  cached?: boolean;
  judgment?: string;
  raw?: unknown;
  semantic?: {
    score: number | null;
    issues: string[];
    assessment: string | null;
    reasoning: string;
    brutalistViolations?: string[];
    zeroToleranceViolations?: string[];
  };
  error?: string;
  message?: string;
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
  extractSemanticInfo(judgment: string | object): {
    score: number | null;
    issues: string[];
    assessment: string | null;
    reasoning: string;
    brutalistViolations?: string[];
    zeroToleranceViolations?: string[];
  };
  estimateCost(data: unknown, provider: string): {
    inputTokens: number;
    outputTokens: number;
    inputCost: string;
    outputCost: string;
    totalCost: string;
    currency: string;
  } | null;
  judgeScreenshot(imagePath: string, prompt: string, context?: ValidationContext): Promise<ValidationResult>;
}

// Core Functions
export function validateScreenshot(
  imagePath: string,
  prompt: string,
  context?: ValidationContext
): Promise<ValidationResult>;

export function extractSemanticInfo(judgment: string | object): {
  score: number | null;
  issues: string[];
  assessment: string | null;
  reasoning: string;
  brutalistViolations?: string[];
  zeroToleranceViolations?: string[];
};

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
  validateFn: (path: string, prompt: string, context: ValidationContext) => Promise<ValidationResult>,
  screenshotPath: string,
  renderedCode: RenderedCode,
  gameState?: Record<string, unknown>,
  personas?: Persona[] | null
): Promise<PerspectiveEvaluation[]>;
export function multiModalValidation(
  validateFn: (path: string, prompt: string, context: ValidationContext) => Promise<ValidationResult>,
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
  constructor(options?: { historyLimit?: number });
  record(score: number, metadata?: Record<string, unknown>): void;
  getBaseline(): number | null;
  getCurrent(): number | null;
  compare(): { improved: boolean; delta: number; percentage: number } | null;
  updateBaseline(): void;
  getStats(): {
    current: number | null;
    baseline: number | null;
    history: Array<{ score: number; timestamp: number; metadata?: Record<string, unknown> }>;
    average: number | null;
    min: number | null;
    max: number | null;
  };
}

// BatchOptimizer Class
export class BatchOptimizer {
  constructor();
  queueRequest<T>(
    validateFn: (...args: any[]) => Promise<T>,
    ...args: any[]
  ): Promise<T>;
  flush(): Promise<void>;
  getStats(): {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
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

