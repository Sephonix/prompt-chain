/**
 * Settings service for managing API provider configurations
 */

// Default settings for API providers
const defaultSettings = {
  providers: {
    openai: {
      enabled: true,
      apiKey: "",
      models: [
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
        { id: "gpt-4", name: "GPT-4" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo" }
      ]
    },
    anthropic: {
      enabled: false,
      apiKey: "",
      models: [
        { id: "claude-2", name: "Claude 2" },
        { id: "claude-instant", name: "Claude Instant" },
        { id: "claude-3-opus", name: "Claude 3 Opus" },
        { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
        { id: "claude-3-haiku", name: "Claude 3 Haiku" }
      ]
    },
    mistralai: {
      enabled: false,
      apiKey: "",
      models: [
        { id: "mistral-small", name: "Mistral Small" },
        { id: "mistral-medium", name: "Mistral Medium" },
        { id: "mistral-large", name: "Mistral Large" }
      ]
    },
    cohere: {
      enabled: false,
      apiKey: "",
      models: [
        { id: "command", name: "Command" },
        { id: "command-light", name: "Command Light" },
        { id: "command-nightly", name: "Command Nightly" }
      ]
    },
    deepseek: {
      enabled: false,
      apiKey: "",
      models: [
        { id: "deepseek-coder", name: "DeepSeek Coder" },
        { id: "deepseek-llm", name: "DeepSeek LLM" }
      ]
    },
    grok: {
      enabled: false,
      apiKey: "",
      models: [
        { id: "grok-1", name: "Grok-1" }
      ]
    },
    openrouter: {
      enabled: false,
      apiKey: "",
      models: [
        { id: "openrouter-default", name: "Default Model" },
        { id: "openrouter-mix", name: "Router Mix" }
      ]
    }
  },
  defaultProvider: "openai",
  defaultModel: "gpt-3.5-turbo"
};

/**
 * Get settings from local storage or return defaults
 * @returns {Object} The settings object
 */
export const getSettings = () => {
  try {
    const storedSettings = localStorage.getItem('promptChainSettings');
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
};

/**
 * Save settings to local storage
 * @param {Object} settings - The settings object to save
 */
export const saveSettings = (settings) => {
  try {
    localStorage.setItem('promptChainSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

/**
 * Update a specific provider's settings
 * @param {string} providerId - The provider ID
 * @param {Object} providerSettings - The new provider settings
 */
export const updateProviderSettings = (providerId, providerSettings) => {
  const settings = getSettings();
  settings.providers[providerId] = {
    ...settings.providers[providerId],
    ...providerSettings
  };
  saveSettings(settings);
  return settings;
};

/**
 * Get all available models from enabled providers
 * @returns {Array} Array of available models with provider info
 */
export const getAvailableModels = () => {
  const settings = getSettings();
  const models = [];
  
  Object.entries(settings.providers).forEach(([providerId, provider]) => {
    if (provider.enabled) {
      provider.models.forEach(model => {
        models.push({
          providerId,
          providerName: getProviderName(providerId),
          ...model
        });
      });
    }
  });
  
  return models;
};

/**
 * Get formatted provider name from ID
 * @param {string} providerId - The provider ID
 * @returns {string} The formatted provider name
 */
export const getProviderName = (providerId) => {
  const providerNames = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    mistralai: "Mistral AI",
    cohere: "Cohere",
    deepseek: "DeepSeek",
    grok: "Grok",
    openrouter: "OpenRouter"
  };
  
  return providerNames[providerId] || providerId;
};

/**
 * Check if settings have been configured for any provider
 * @returns {boolean} True if at least one provider is configured
 */
export const hasConfiguredProvider = () => {
  const settings = getSettings();
  return Object.values(settings.providers).some(
    provider => provider.enabled && provider.apiKey
  );
}; 