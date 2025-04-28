/**
 * Provider Registry
 * Central configuration for all LLM providers and models
 */

// Import provider implementations
import openaiProvider from './openai';
import anthropicProvider from './anthropic';
import mistralProvider from './mistral';
import cohereProvider from './cohere';
import deepseekProvider from './deepseek';
import grokProvider from './grok';
import openrouterProvider from './openrouter';

// The registry of all available providers
const providerRegistry = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  mistral: mistralProvider,
  cohere: cohereProvider,
  deepseek: deepseekProvider,
  grok: grokProvider,
  openrouter: openrouterProvider
};

/**
 * Get the provider object by ID
 * @param {string} providerId - The provider ID
 * @returns {Object} The provider object or undefined
 */
export const getProvider = (providerId) => {
  return providerRegistry[providerId];
};

/**
 * Get all available providers
 * @returns {Object} Map of all providers
 */
export const getAllProviders = () => {
  return { ...providerRegistry };
};

/**
 * Get all provider IDs
 * @returns {Array} Array of provider IDs
 */
export const getProviderIds = () => {
  return Object.keys(providerRegistry);
};

/**
 * Find the provider for a given model ID
 * @param {string} modelId - The model ID to find
 * @returns {string} The provider ID or 'openai' as default
 */
export const findProviderForModel = (modelId) => {
  if (!modelId) return 'openai';
  
  // Check if any provider has this model
  for (const [providerId, provider] of Object.entries(providerRegistry)) {
    if (provider.models.some(model => model.id === modelId)) {
      return providerId;
    }
    
    // Check by keyword matching
    if (provider.modelIdentifiers.some(identifier => modelId.includes(identifier))) {
      return providerId;
    }
  }
  
  // Default to OpenAI if no match found
  return 'openai';
};

/**
 * Get all available models across all providers
 * @param {boolean} enabledOnly - Only include models from enabled providers
 * @param {Object} settings - Current settings
 * @returns {Array} Array of model objects with provider info
 */
export const getAllModels = (enabledOnly = true, settings = null) => {
  const models = [];
  
  Object.entries(providerRegistry).forEach(([providerId, provider]) => {
    // Skip disabled providers if enabledOnly is true
    if (enabledOnly && 
        settings && 
        settings.providers && 
        settings.providers[providerId] && 
        !settings.providers[providerId].enabled) {
      return;
    }
    
    // Add models from this provider
    provider.models.forEach(model => {
      models.push({
        providerId,
        providerName: provider.name,
        ...model
      });
    });
  });
  
  return models;
};

export default {
  getProvider,
  getAllProviders,
  getProviderIds,
  findProviderForModel,
  getAllModels
}; 