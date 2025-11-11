/**
 * Structured Data Extractor
 * 
 * Extracts structured data from VLLM responses using multiple strategies:
 * - JSON parsing (if response contains JSON)
 * - LLM extraction (if LLM is available)
 * - Regex fallback (simple patterns)
 * 
 * General-purpose utility - no domain-specific logic.
 */

import { createConfig } from './config.mjs';

/**
 * Extract structured data from text using multiple strategies
 */
export async function extractStructuredData(text, schema, options = {}) {
  if (!text) return null;
  
  const {
    fallback = 'llm', // 'llm' | 'regex' | 'json'
    provider = null
  } = options;
  
  // Strategy 1: Try JSON parsing first (fastest)
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate against schema
      if (validateSchema(parsed, schema)) {
        return parsed;
      }
    }
  } catch (error) {
    // JSON parsing failed, try next strategy
  }
  
  // Strategy 2: Try LLM extraction (if available and requested)
  if (fallback === 'llm' || fallback === 'auto') {
    try {
      const config = createConfig({ provider });
      if (config.enabled) {
        const extracted = await extractWithLLM(text, schema, config);
        if (extracted) {
          return extracted;
        }
      }
    } catch (error) {
      console.warn(`[DataExtractor] LLM extraction failed: ${error.message}`);
    }
  }
  
  // Strategy 3: Try regex fallback
  if (fallback === 'regex' || fallback === 'auto') {
    try {
      const extracted = extractWithRegex(text, schema);
      if (extracted) {
        return extracted;
      }
    } catch (error) {
      console.warn(`[DataExtractor] Regex extraction failed: ${error.message}`);
    }
  }
  
  return null;
}

/**
 * Extract structured data using LLM
 */
async function extractWithLLM(text, schema, config) {
  const prompt = `Extract structured data from the following text. Return ONLY valid JSON matching this schema:

Schema:
${JSON.stringify(schema, null, 2)}

Text to extract from:
${text}

Return ONLY the JSON object, no other text.`;

  try {
    const response = await callLLM(prompt, config);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (validateSchema(parsed, schema)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn(`[DataExtractor] LLM extraction error: ${error.message}`);
  }
  
  return null;
}

/**
 * Call LLM API (text-only, no vision)
 */
async function callLLM(prompt, config) {
  const apiKey = config.apiKey;
  const provider = config.provider || 'gemini';
  
  switch (provider) {
    case 'gemini': {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000
          }
        })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    
    case 'openai': {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 1000
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
    
    case 'claude': {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      return data.content?.[0]?.text || '';
    }
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Escape special regex characters to prevent ReDoS
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract structured data using regex patterns
 */
function extractWithRegex(text, schema) {
  const result = {};
  
  for (const [key, field] of Object.entries(schema)) {
    const { type, required = false } = field;
    
    // Escape key to prevent ReDoS attacks
    const escapedKey = escapeRegex(key);
    
    // Try to find value in text
    let value = null;
    
    if (type === 'number') {
      // Look for number patterns
      const match = text.match(new RegExp(`${escapedKey}[\\s:=]+([0-9.]+)`, 'i'));
      if (match) {
        value = parseFloat(match[1]);
      }
    } else if (type === 'string') {
      // Look for string patterns
      const match = text.match(new RegExp(`${escapedKey}[\\s:=]+([^\\n,]+)`, 'i'));
      if (match) {
        value = match[1].trim();
      }
    } else if (type === 'boolean') {
      // Look for boolean patterns
      const match = text.match(new RegExp(`${escapedKey}[\\s:=]+(true|false|yes|no)`, 'i'));
      if (match) {
        value = match[1].toLowerCase() === 'true' || match[1].toLowerCase() === 'yes';
      }
    }
    
    if (value !== null) {
      result[key] = value;
    } else if (required) {
      // Required field not found
      return null;
    }
  }
  
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Validate extracted data against schema
 */
function validateSchema(data, schema) {
  if (!data || typeof data !== 'object') return false;
  
  for (const [key, field] of Object.entries(schema)) {
    const { type, required = false } = field;
    
    if (required && !(key in data)) {
      return false;
    }
    
    if (key in data) {
      const value = data[key];
      
      if (type === 'number' && typeof value !== 'number') {
        return false;
      } else if (type === 'string' && typeof value !== 'string') {
        return false;
      } else if (type === 'boolean' && typeof value !== 'boolean') {
        return false;
      }
    }
  }
  
  return true;
}

