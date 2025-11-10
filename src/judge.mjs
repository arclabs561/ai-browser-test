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
      throw new Error(`Screenshot not found: ${imagePath}`);
    }
    const imageBuffer = readFileSync(imagePath);
    return imageBuffer.toString('base64');
  }

  /**
   * Judge screenshot using VLLM API
   */
  async judgeScreenshot(imagePath, prompt, context = {}) {
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
      const cached = getCached(imagePath, prompt, context);
      if (cached) {
        if (this.config.debug.verbose) {
          console.log(`[VLLM] Cache hit for ${imagePath}`);
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

    try {
      const base64Image = this.imageToBase64(imagePath);
      const fullPrompt = this.buildPrompt(prompt, context);
      
      // Route to appropriate API based on provider
      switch (this.provider) {
        case 'gemini':
          response = await this.callGeminiAPI(base64Image, fullPrompt, abortController.signal);
          clearTimeout(timeoutId);
          data = await response.json();
          
          if (data.error) {
            throw new Error(`Gemini API error: ${data.error.message}`);
          }
          
          judgment = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
          break;
          
        case 'openai':
          response = await this.callOpenAIAPI(base64Image, fullPrompt, abortController.signal);
          clearTimeout(timeoutId);
          data = await response.json();
          
          if (data.error) {
            throw new Error(`OpenAI API error: ${data.error.message}`);
          }
          
          judgment = data.choices?.[0]?.message?.content || 'No response';
          break;
          
        case 'claude':
          response = await this.callClaudeAPI(base64Image, fullPrompt, abortController.signal);
          clearTimeout(timeoutId);
          data = await response.json();
          judgment = data.content?.[0]?.text || 'No response';
          break;
          
        default:
          throw new Error(`Unknown provider: ${this.provider}`);
      }
      
      const responseTime = Date.now() - startTime;
      const semanticInfo = this.extractSemanticInfo(judgment);
      const result = {
        enabled: true,
        provider: this.provider,
        judgment,
        score: semanticInfo.score,
        issues: semanticInfo.issues,
        assessment: semanticInfo.assessment,
        reasoning: semanticInfo.reasoning,
        pricing: this.providerConfig.pricing,
        estimatedCost: this.estimateCost(data, this.provider),
        responseTime,
        timestamp: new Date().toISOString(),
        testName: context.testType || context.step || 'unknown',
        viewport: context.viewport || null,
        raw: data,
        semantic: semanticInfo
      };
      
      // Cache result
      if (useCache) {
        setCached(imagePath, prompt, context, result);
      }
      
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      error = err;
      
      return {
        enabled: true,
        provider: this.provider,
        error: error.message,
        judgment: 'No response',
        score: null,
        issues: [],
        assessment: null,
        reasoning: `API call failed: ${error.message}`,
        responseTime: Date.now() - startTime,
        pricing: this.providerConfig.pricing
      };
    }
  }

  /**
   * Build prompt for screenshot validation
   */
  buildPrompt(prompt, context) {
    // If custom prompt builder provided, use it
    if (context.promptBuilder && typeof context.promptBuilder === 'function') {
      return context.promptBuilder(prompt, context);
    }
    
    // Otherwise, use prompt as-is (caller should build full prompt)
    return prompt;
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
   */
  async callGeminiAPI(base64Image, prompt, signal) {
    return fetch(
      `${this.providerConfig.apiUrl}/models/${this.providerConfig.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: base64Image
                }
              }
            ]
          }],
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
   */
  async callOpenAIAPI(base64Image, prompt, signal) {
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
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64Image}` }
            }
          ]
        }],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.95
      })
    });
  }

  /**
   * Call Anthropic Claude API
   */
  async callClaudeAPI(base64Image, prompt, signal) {
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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Image
              }
            }
          ]
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
