/**
 * Settings service for managing API provider configurations
 */

import { getAllProviders, getProvider } from '../providers';

// Safely access electron's ipcRenderer
const ipcRenderer = window.electron?.ipcRenderer;

// Create default settings by importing provider information
const createDefaultSettings = async () => {
  try {
    // Get providers info from main process (where we can require the provider modules)
    const providersInfo = await ipcRenderer.invoke('get-providers-info');
    
    // Create settings structure
    const settings = {
      providers: {},
      defaultProvider: 'openai',
      defaultModel: 'gpt-4o-mini'
    };
    
    // Add each provider with empty API key
    Object.keys(providersInfo).forEach(providerId => {
      const provider = providersInfo[providerId];
      settings.providers[providerId] = {
        enabled: providerId === 'openai', // Enable OpenAI by default
        apiKey: '',
        models: provider.models || []
      };
    });
    
    return settings;
  } catch (error) {
    console.error('Error creating default settings:', error);
    
    // Fallback default settings if we can't get provider info
    return {
      providers: {
        openai: {
          enabled: true,
          apiKey: '',
          models: []
        }
      },
      defaultProvider: 'openai',
      defaultModel: 'gpt-4o-mini'
    };
  }
};

// Cache for default settings
let defaultSettingsCache = null;

/**
 * Get default settings (cached)
 * @returns {Promise<Object>} The default settings object
 */
export const getDefaultSettings = async () => {
  if (!defaultSettingsCache) {
    defaultSettingsCache = await createDefaultSettings();
  }
  return JSON.parse(JSON.stringify(defaultSettingsCache));
};

/**
 * Get settings from local storage or return defaults
 * @returns {Promise<Object>} The settings object
 */
export const getSettings = async () => {
  try {
    const storedSettings = localStorage.getItem('promptChainSettings');
    if (storedSettings) {
      const loadedSettings = JSON.parse(storedSettings);
      // Get default settings to ensure we have a complete structure
      const defaultSettings = await getDefaultSettings();
      
      // Merge saved provider settings (enabled, apiKey) into the final settings
      Object.keys(defaultSettings.providers).forEach(providerId => {
        if (loadedSettings.providers && loadedSettings.providers[providerId]) {
          defaultSettings.providers[providerId].enabled = 
            loadedSettings.providers[providerId].enabled;
          defaultSettings.providers[providerId].apiKey = 
            loadedSettings.providers[providerId].apiKey;
        }
      });

      // Merge top-level settings
      if (loadedSettings.defaultProvider) {
        defaultSettings.defaultProvider = loadedSettings.defaultProvider;
      }
      if (loadedSettings.defaultModel) {
        defaultSettings.defaultModel = loadedSettings.defaultModel;
      }
      
      return defaultSettings;
    }
    
    // If no stored settings, return defaults
    return getDefaultSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
};

/**
 * Save settings to local storage and synchronize with main process
 * @param {Object} settings - The settings object to save
 */
export const saveSettings = async (settings) => {
  try {
    // Save to localStorage for UI state
    localStorage.setItem('promptChainSettings', JSON.stringify(settings));
    
    // Synchronize with main process if available
    if (ipcRenderer) {
      console.log('[settingsService] Syncing settings with main process');
      await ipcRenderer.invoke('save-settings', settings);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

/**
 * Update a specific provider's settings
 * @param {string} providerId - The provider ID
 * @param {Object} providerSettings - The new provider settings
 */
export const updateProviderSettings = async (providerId, providerSettings) => {
  const settings = await getSettings();
  settings.providers[providerId] = {
    ...settings.providers[providerId],
    ...providerSettings
  };
  await saveSettings(settings);
  return settings;
};

/**
 * Get all available models from enabled providers
 * @returns {Promise<Array>} Array of available models with provider info
 */
export const getAvailableModels = async () => {
  const settings = await getSettings();
  const models = [];
  
  // Get providers info from main process
  const providersInfo = await ipcRenderer.invoke('get-providers-info');
  
  Object.entries(settings.providers).forEach(([providerId, providerSettings]) => {
    if (providerSettings.enabled && providersInfo[providerId]) {
      providersInfo[providerId].models.forEach(model => {
        models.push({
          providerId,
          providerName: providersInfo[providerId].name,
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
 * @returns {Promise<string>} The formatted provider name
 */
export const getProviderName = async (providerId) => {
  const providersInfo = await ipcRenderer.invoke('get-providers-info');
  return providersInfo[providerId]?.name || providerId;
};

/**
 * Check if settings have been configured for any provider
 * @returns {Promise<boolean>} True if at least one provider is configured
 */
export const hasConfiguredProvider = async () => {
  const settings = await getSettings();
  return Object.values(settings.providers).some(
    provider => provider.enabled && provider.apiKey
  );
}; 