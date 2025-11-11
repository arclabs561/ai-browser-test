/**
 * Configuration System
 * 
 * Handles provider selection, API keys, and settings.
 * Designed to be flexible and extensible.
 */

import { ConfigError } from './errors.mjs';

/**
 * Default provider configurations
 */
const PROVIDER_CONFIGS = {
  gemini: {
    name: 'gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
    freeTier: true,
    pricing: { input: 0.30, output: 2.50 }, // per 1M tokens
    priority: 1 // Higher priority = preferred
  },
  openai: {
    name: 'openai',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    freeTier: false,
    pricing: { input: 0.60, output: 2.40 },
    priority: 2
  },
  claude: {
    name: 'claude',
    apiUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-haiku-20241022',
    freeTier: false,
    pricing: { input: 1.00, output: 5.00 },
    priority: 3
  }
};

/**
 * Create configuration from environment or options
 */
export function createConfig(options = {}) {
  const {
    provider = null,
    apiKey = null,
    env = process.env,
    cacheDir = null,
    cacheEnabled = true,
    maxConcurrency = 5,
    timeout = 30000,
    verbose = false
  } = options;

  // Auto-detect provider if not specified
  let selectedProvider = provider;
  if (!selectedProvider) {
    selectedProvider = detectProvider(env);
  }

  // Get API key
  const selectedApiKey = apiKey || getApiKey(selectedProvider, env);

  // Get provider config
  const providerConfig = PROVIDER_CONFIGS[selectedProvider] || PROVIDER_CONFIGS.gemini;

  return {
    provider: selectedProvider,
    apiKey: selectedApiKey,
    providerConfig,
    enabled: !!selectedApiKey,
    cache: {
      enabled: cacheEnabled,
      dir: cacheDir
    },
    performance: {
      maxConcurrency,
      timeout
    },
    debug: {
      verbose
    }
  };
}

/**
 * Detect provider from environment variables
 */
function detectProvider(env) {
  // Priority: explicit VLM_PROVIDER > auto-detect from API keys > default to gemini
  const explicitProvider = env.VLM_PROVIDER?.trim().toLowerCase();
  if (explicitProvider && PROVIDER_CONFIGS[explicitProvider]) {
    return explicitProvider;
  }

  // Auto-detect: prefer cheaper providers first
  const availableProviders = Object.values(PROVIDER_CONFIGS)
    .filter(config => {
      const key = env[`${config.name.toUpperCase()}_API_KEY`] || env.API_KEY;
      return !!key;
    })
    .sort((a, b) => a.priority - b.priority); // Lower priority number = higher priority

  return availableProviders.length > 0 
    ? availableProviders[0].name 
    : 'gemini'; // Default to gemini (cheapest)
}

/**
 * Get API key for provider
 */
function getApiKey(provider, env) {
  return env[`${provider.toUpperCase()}_API_KEY`] || env.API_KEY || null;
}

/**
 * Get current configuration (singleton)
 */
let configInstance = null;

export function getConfig() {
  if (!configInstance) {
    configInstance = createConfig();
  }
  return configInstance;
}

/**
 * Set configuration (useful for testing)
 */
export function setConfig(config) {
  configInstance = config;
}

/**
 * Get provider configuration
 */
export function getProvider(providerName = null) {
  const config = getConfig();
  const provider = providerName || config.provider;
  return PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.gemini;
}

