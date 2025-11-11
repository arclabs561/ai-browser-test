/**
 * VLLM Judge
 * 
 * Core screenshot validation using Vision Language Models.
 * Supports multiple providers (Gemini, OpenAI, Claude).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createConfig, getConfig } from './config.mjs';
import { getCached, setCached } from './cache.mjs';
import { FileError, ProviderError, TimeoutError } from './errors.mjs';
import { log, warn } from './logger.mjs';
import { retryWithBackoff, enhanceErrorMessage } from './retry.mjs';
import { recordCost } from './cost-tracker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * VLLM Judge Class
 * 
 * Handles screenshot validation using Vision Language Models.
 */
export class VLLMJudge {
  constructor(options = {}) {
    this.config = createConfig(options);
    this.provider = this.config.provider;
    this.apiKey = this.config.apiKey;
    this.providerConfig = this.config.providerConfig;
    this.enabled = this.config.enabled;
    this._cacheInitialized = false;
  }

  /**
   * Initialize cache (lazy initialization)
   */
  async _initCache() {
    if (this._cacheInitialized || !this.config.cache.enabled) return;
    
    if (this.config.cache.dir) {
      const { initCache } = await import('./cache.mjs');
      initCache(this.config.cache.dir);
    }
    this._cacheInitialized = true;
  }

  /**
   * Convert image to base64 for API
   */
  imageToBase64(imagePath) {
    if (!existsSync(imagePath)) {
      throw new FileError(`Screenshot not found: ${imagePath}`, imagePath);
    }
    try {
      const imageBuffer = readFileSync(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      throw new FileError(`Failed to read screenshot: ${error.message}`, imagePath, { originalError: error.message });
    }
  }

  /**
   * Judge screenshot using VLLM API
   * 
   * @param {string | string[]} imagePath - Single image path or array of image paths for comparison
   * @param {string} prompt - Evaluation prompt
   * @param {import('./index.mjs').ValidationContext} [context={}] - Validation context
   * @returns {Promise<import('./index.mjs').ValidationResult>} Validation result
   */
  async judgeScreenshot(imagePath, prompt, context = {}) {
    // Support both single image and multi-image (for pair comparison)
    const imagePaths = Array.isArray(imagePath) ? imagePath : [imagePath];
    const isMultiImage = imagePaths.length > 1;
    if (!this.enabled) {
      return {
        enabled: false,
        provider: this.provider,
        message: `API validation disabled (set ${this.provider.toUpperCase()}_API_KEY or API_KEY)`,
        pricing: this.providerConfig.pricing
      };
    }

    // Initialize cache if needed
    await this._initCache();
    
    // Check cache first (if caching enabled)
    const useCache = context.useCache !== false && this.config.cache.enabled;
    if (useCache) {
      const cacheKey = isMultiImage ? imagePaths.join('|') : imagePath;
      const cached = getCached(cacheKey, prompt, context);
      if (cached) {
        if (this.config.debug.verbose) {
          log(`[VLLM] Cache hit for ${cacheKey}`);
        }
        return { ...cached, cached: true };
      }
    }

    const startTime = Date.now();
    const timeout = context.timeout || this.config.performance.timeout;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);
    
    let response;
    let data;
    let judgment = null;
    let error = null;
    let attempts = 0;

    try {
      // Convert all images to base64
      const base64Images = imagePaths.map(path => this.imageToBase64(path));
      const fullPrompt = this.buildPrompt(prompt, context, isMultiImage);
      
      // Retry API calls with exponential backoff
      const maxRetries = context.maxRetries ?? 3;
      const apiResult = await retryWithBackoff(async () => {
        attempts++;
        let apiResponse;
        let apiData;
        let logprobs = null; // Declare once outside switch
        
        // Route to appropriate API based on provider
        switch (this.provider) {
          case 'gemini':
            apiResponse = await this.callGeminiAPI(base64Images, fullPrompt, abortController.signal, isMultiImage);
            clearTimeout(timeoutId);
            apiData = await apiResponse.json();
            
            if (apiData.error) {
              const statusCode = apiResponse.status;
              throw new ProviderError(
                `Gemini API error: ${apiData.error.message}`,
                'gemini',
                {
                  apiError: apiData.error,
                  statusCode,
                  retryable: statusCode === 429 || statusCode >= 500
                }
              );
            }
            
            // Extract logprobs if available (for uncertainty estimation)
            logprobs = apiData.candidates?.[0]?.content?.parts?.[0]?.logprobs || null;
            
            return {
              judgment: apiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response',
              data: apiData,
              logprobs
            };
            
          case 'openai':
            apiResponse = await this.callOpenAIAPI(base64Images, fullPrompt, abortController.signal, isMultiImage);
            clearTimeout(timeoutId);
            apiData = await apiResponse.json();
            
            if (apiData.error) {
              const statusCode = apiResponse.status;
              throw new ProviderError(
                `OpenAI API error: ${apiData.error.message}`,
                'openai',
                {
                  apiError: apiData.error,
                  statusCode,
                  retryable: statusCode === 429 || statusCode >= 500
                }
              );
            }
            
            // Extract logprobs if available (OpenAI provides logprobs when requested)
            logprobs = apiData.choices?.[0]?.logprobs || null;
            
            return {
              judgment: apiData.choices?.[0]?.message?.content || 'No response',
              data: apiData,
              logprobs
            };
            
          case 'claude':
            apiResponse = await this.callClaudeAPI(base64Images, fullPrompt, abortController.signal, isMultiImage);
            clearTimeout(timeoutId);
            apiData = await apiResponse.json();
            
            if (apiData.error) {
              const statusCode = apiResponse.status;
              throw new ProviderError(
                `Claude API error: ${apiData.error.message || 'Unknown error'}`,
                'claude',
                {
                  apiError: apiData.error,
                  statusCode,
                  retryable: statusCode === 429 || statusCode >= 500
                }
              );
            }
            
            // Claude doesn't provide logprobs in standard API
            logprobs = null;
            
            return {
              judgment: apiData.content?.[0]?.text || 'No response',
              data: apiData,
              logprobs
            };
            
          default:
            throw new ProviderError(`Unknown provider: ${this.provider}`, this.provider);
        }
      }, {
        maxRetries,
        baseDelay: 1000,
        maxDelay: 30000,
        onRetry: (err, attempt, delay) => {
          if (this.config.debug.verbose) {
            warn(`[VLLM] Retry ${attempt}/${maxRetries} for ${this.provider} API: ${err.message} (waiting ${delay}ms)`);
          }
        }
      });
      
      judgment = apiResult.judgment;
      data = apiResult.data;
      const logprobs = apiResult.logprobs || null;
      
      const responseTime = Date.now() - startTime;
      const semanticInfo = this.extractSemanticInfo(judgment);
      
      // Estimate cost (data might not be available if retry succeeded)
      const estimatedCost = data ? this.estimateCost(data, this.provider) : null;
      
      // Record cost for tracking
      if (estimatedCost && estimatedCost.totalCost) {
        try {
          recordCost({
            provider: this.provider,
            cost: estimatedCost.totalCost,
            inputTokens: estimatedCost.inputTokens || 0,
            outputTokens: estimatedCost.outputTokens || 0,
            testName: context.testType || context.step || 'unknown'
          });
        } catch {
          // Silently fail if cost tracking unavailable
        }
      }
      
      const validationResult = {
        enabled: true,
        provider: this.provider,
        judgment,
        score: semanticInfo.score,
        issues: semanticInfo.issues,
        assessment: semanticInfo.assessment,
        reasoning: semanticInfo.reasoning,
        pricing: this.providerConfig.pricing,
        estimatedCost,
        responseTime,
        timestamp: new Date().toISOString(),
        testName: context.testType || context.step || 'unknown',
        viewport: context.viewport || null,
        raw: data || null,
        semantic: semanticInfo,
        attempts: attempts || 1,
        logprobs // Include logprobs for uncertainty estimation (if available)
      };
      
      // Cache result (use first image path for single image, or combined key for multi-image)
      if (useCache) {
        const cacheKey = isMultiImage ? imagePaths.join('|') : imagePath;
        setCached(cacheKey, prompt, context, validationResult);
      }
      
      return validationResult;
    } catch (err) {
      clearTimeout(timeoutId);
      error = err;
      
      // Handle timeout errors specifically
      if (error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('aborted')) {
        const enhancedMessage = enhanceErrorMessage(
          new TimeoutError(`VLLM API call timed out after ${timeout}ms`, timeout),
          attempts || 1,
          'judgeScreenshot'
        );
        throw new TimeoutError(enhancedMessage, timeout, {
          provider: this.provider,
          imagePath,
          attempts: attempts || 1
        });
      }
      
      // Re-throw ProviderError with enhanced context
      if (error instanceof ProviderError) {
        const enhancedMessage = enhanceErrorMessage(error, attempts || 1, 'judgeScreenshot');
        throw new ProviderError(enhancedMessage, this.provider, {
          ...error.details,
          imagePath,
          prompt: prompt.substring(0, 100),
          attempts: attempts || 1
        });
      }
      
      // Re-throw FileError and TimeoutError as-is (already have context)
      if (error instanceof FileError || error instanceof TimeoutError) {
        throw error;
      }
      
      // For other errors, enhance message and return error object (backward compatibility)
      const enhancedMessage = enhanceErrorMessage(error, attempts || 1, 'judgeScreenshot');
      return {
        enabled: true,
        provider: this.provider,
        error: enhancedMessage,
        judgment: 'No response',
        score: null,
        issues: [],
        assessment: null,
        reasoning: `API call failed: ${enhancedMessage}`,
        responseTime: Date.now() - startTime,
        pricing: this.providerConfig.pricing,
        attempts: attempts || 1
      };
    }
  }

  /**
   * Build prompt for screenshot validation
   * 
   * Uses unified prompt composition system for research-backed consistency.
   * Research: Explicit rubrics improve reliability by 10-20% (arXiv:2412.05579)
   * 
   * @param {string} prompt - Base prompt
   * @param {import('./index.mjs').ValidationContext} context - Validation context
   * @param {boolean} [isMultiImage=false] - Whether this is a multi-image comparison
   * @returns {string} Full prompt with context
   */
  buildPrompt(prompt, context = {}, isMultiImage = false) {
    // If custom prompt builder provided, use it
    if (context.promptBuilder && typeof context.promptBuilder === 'function') {
      return context.promptBuilder(prompt, context);
    }
    
    // Use unified prompt composition system
    try {
      if (isMultiImage) {
        return composeComparisonPrompt(prompt, context, {
          includeRubric: context.includeRubric !== false // Default true (research-backed)
        });
      } else {
        return composeSingleImagePrompt(prompt, context, {
          includeRubric: context.includeRubric !== false, // Default true (research-backed)
          temporalNotes: context.temporalNotes || null
        });
      }
    } catch (error) {
      // Fallback to basic prompt building if composition fails
      if (this.config.debug.verbose) {
        warn(`[VLLM] Prompt composition failed, using fallback: ${error.message}`);
      }
      
      // Basic fallback (original implementation)
      let fullPrompt = prompt;
      const contextParts = [];
      if (context.testType) {
        contextParts.push(`Test Type: ${context.testType}`);
      }
      if (context.viewport) {
        contextParts.push(`Viewport: ${context.viewport.width}x${context.viewport.height}`);
      }
      if (context.gameState) {
        contextParts.push(`Game State: ${JSON.stringify(context.gameState)}`);
      }
      if (contextParts.length > 0) {
        fullPrompt = `${prompt}\n\nContext:\n${contextParts.join('\n')}`;
      }
      if (isMultiImage) {
        fullPrompt = `${fullPrompt}\n\nYou are comparing two screenshots side-by-side. Return JSON with:
{
  "winner": "A" | "B" | "tie",
  "confidence": 0.0-1.0,
  "reasoning": "explanation",
  "differences": ["difference1", "difference2"],
  "scores": {"A": 0-10, "B": 0-10}
}`;
      }
      return fullPrompt;
    }
  }

  /**
   * Extract semantic information from judgment text
   */
  extractSemanticInfo(judgment) {
    // Handle case where judgment is already an object
    if (typeof judgment === 'object' && judgment !== null && !Array.isArray(judgment)) {
      return {
        score: judgment.score || null,
        issues: judgment.issues || [],
        assessment: judgment.assessment || null,
        reasoning: judgment.reasoning || null,
        brutalistViolations: judgment.brutalistViolations || [],
        zeroToleranceViolations: judgment.zeroToleranceViolations || []
      };
    }

    // Handle case where judgment is a string
    const judgmentText = typeof judgment === 'string' ? judgment : String(judgment || '');
    
    try {
      const jsonMatch = judgmentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: parsed.score || null,
          issues: parsed.issues || [],
          assessment: parsed.assessment || null,
          reasoning: parsed.reasoning || null,
          brutalistViolations: parsed.brutalistViolations || [],
          zeroToleranceViolations: parsed.zeroToleranceViolations || []
        };
      }
    } catch (e) {
      // Fall through to regex extraction
    }

    // Fallback: extract basic info from text
    return {
      score: this.extractScore(judgmentText),
      issues: this.extractIssues(judgmentText),
      assessment: this.extractAssessment(judgmentText),
      reasoning: judgmentText.substring(0, 500)
    };
  }

  /**
   * Extract score from judgment text
   */
  extractScore(judgment) {
    if (!judgment || typeof judgment !== 'string') return null;
    
    const patterns = [
      /"score"\s*:\s*(\d+)/i,
      /score[:\s]*(\d+)/i,
      /score[:\s]*(\d+)\s*\/\s*10/i,
      /(\d+)\s*\/\s*10/i
    ];
    
    for (const pattern of patterns) {
      const match = judgment.match(pattern);
      if (match) {
        const score = parseInt(match[1]);
        if (score >= 0 && score <= 10) {
          return score;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract issues from judgment text
   */
  extractIssues(judgment) {
    try {
      const jsonMatch = judgment.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.issues || [];
      }
    } catch (e) {
      // Fall through to regex
    }

    const issues = [];
    const lines = judgment.split('\n');
    for (const line of lines) {
      if (line.match(/[-*]\s*(.+)/i) || line.match(/\d+\.\s*(.+)/i)) {
        issues.push(line.replace(/[-*]\s*|\d+\.\s*/i, '').trim());
      }
    }
    
    return issues;
  }

  /**
   * Extract assessment from judgment text
   */
  extractAssessment(judgment) {
    try {
      const jsonMatch = judgment.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.assessment || null;
      }
    } catch (e) {
      // Fall through to regex
    }

    const lower = judgment.toLowerCase();
    if (lower.includes('pass') && !lower.includes('fail')) {
      return 'pass';
    }
    if (lower.includes('fail')) {
      return 'fail';
    }
    
    return null;
  }

  /**
   * Call Google Gemini API
   * 
   * @param {string | string[]} base64Images - Single image or array of images (base64)
   * @param {string} prompt - Evaluation prompt
   * @param {AbortSignal} signal - Abort signal for timeout
   * @param {boolean} [isMultiImage=false] - Whether this is a multi-image request
   * @returns {Promise<Response>} API response
   */
  async callGeminiAPI(base64Images, prompt, signal, isMultiImage = false) {
    const images = Array.isArray(base64Images) ? base64Images : [base64Images];
    
    // Build parts array: text prompt + all images
    const parts = [{ text: prompt }];
    for (const base64Image of images) {
      parts.push({
        inline_data: {
          mime_type: 'image/png',
          data: base64Image
        }
      });
    }
    
    // SECURITY: Use header for API key, not URL parameter
    // API keys in URLs are exposed in logs, browser history, referrer headers
    return fetch(
      `${this.providerConfig.apiUrl}/models/${this.providerConfig.model}:generateContent`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey  // Use header instead of URL parameter
        },
        signal,
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000,
            topP: 0.95,
            topK: 40
          }
        })
      }
    );
  }

  /**
   * Call OpenAI API
   * 
   * @param {string | string[]} base64Images - Single image or array of images (base64)
   * @param {string} prompt - Evaluation prompt
   * @param {AbortSignal} signal - Abort signal for timeout
   * @param {boolean} [isMultiImage=false] - Whether this is a multi-image request
   * @returns {Promise<Response>} API response
   */
  async callOpenAIAPI(base64Images, prompt, signal, isMultiImage = false) {
    const images = Array.isArray(base64Images) ? base64Images : [base64Images];
    
    // Build content array: text prompt + all images
    const content = [{ type: 'text', text: prompt }];
    for (const base64Image of images) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${base64Image}` }
      });
    }
    
    return fetch(`${this.providerConfig.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      signal,
      body: JSON.stringify({
        model: this.providerConfig.model,
        messages: [{
          role: 'user',
          content
        }],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.95,
        logprobs: true, // Request logprobs for uncertainty estimation
        top_logprobs: 5
      })
    });
  }

  /**
   * Call Anthropic Claude API
   * 
   * @param {string | string[]} base64Images - Single image or array of images (base64)
   * @param {string} prompt - Evaluation prompt
   * @param {AbortSignal} signal - Abort signal for timeout
   * @param {boolean} [isMultiImage=false] - Whether this is a multi-image request
   * @returns {Promise<Response>} API response
   */
  async callClaudeAPI(base64Images, prompt, signal, isMultiImage = false) {
    const images = Array.isArray(base64Images) ? base64Images : [base64Images];
    
    // Build content array: text prompt + all images
    const content = [{ type: 'text', text: prompt }];
    for (const base64Image of images) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64Image
        }
      });
    }
    
    return fetch(`${this.providerConfig.apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      signal,
      body: JSON.stringify({
        model: this.providerConfig.model,
        max_tokens: 2000, // Increased for pair comparison
        messages: [{
          role: 'user',
          content
        }]
      })
    });
  }

  /**
   * Estimate cost based on token usage
   */
  estimateCost(data, provider) {
    if (!this.providerConfig.pricing || this.providerConfig.pricing.input === 0) {
      return null; // Free or self-hosted
    }
    
    let inputTokens = 0;
    let outputTokens = 0;
    
    switch (provider) {
      case 'gemini':
        inputTokens = data.usageMetadata?.promptTokenCount || 0;
        outputTokens = data.usageMetadata?.candidatesTokenCount || 0;
        break;
      case 'openai':
        inputTokens = data.usage?.prompt_tokens || 0;
        outputTokens = data.usage?.completion_tokens || 0;
        break;
      case 'claude':
        inputTokens = data.usage?.input_tokens || 0;
        outputTokens = data.usage?.output_tokens || 0;
        break;
    }
    
    const inputCost = (inputTokens / 1_000_000) * this.providerConfig.pricing.input;
    const outputCost = (outputTokens / 1_000_000) * this.providerConfig.pricing.output;
    const totalCost = inputCost + outputCost;
    
    return {
      inputTokens,
      outputTokens,
      inputCost: inputCost.toFixed(6),
      outputCost: outputCost.toFixed(6),
      totalCost: totalCost.toFixed(6),
      currency: 'USD'
    };
  }
}

/**
 * Validate screenshot (convenience function)
 * 
 * Creates a judge instance and validates a screenshot.
 */
export async function validateScreenshot(imagePath, prompt, context = {}) {
  const judge = new VLLMJudge(context);
  return judge.judgeScreenshot(imagePath, prompt, context);
}
