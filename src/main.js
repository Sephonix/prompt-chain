const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Import provider registry
const providersPath = path.join(__dirname, 'providers');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Path to store API keys securely
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

// Function to load settings with API keys
const loadSettings = () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    } else {
      // Default empty settings
      return { providers: {} };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    return { providers: {} };
  }
};

// Function to save settings
const saveSettings = (settings) => {
  try {
    // Make sure the directory exists
    const settingsDir = path.dirname(settingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }
    
    // Save the settings
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`Settings saved to ${settingsPath}`);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// Check if this is a production build and first run
const isFirstRun = () => {
  const lockFile = path.join(userDataPath, '.init-lock');
  if (process.env.NODE_ENV === 'production' && !fs.existsSync(lockFile)) {
    // Create lock file to mark initialization
    try {
      fs.writeFileSync(lockFile, new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Error creating init lock file:', error);
    }
  }
  return false;
};

// Clear sensitive data on first production run
const clearSensitiveData = () => {
  if (isFirstRun()) {
    console.log('First production run detected. Clearing any sensitive data...');
    // Create empty settings with default structure from providers
    const emptySettings = { providers: {} };
    
    // Load provider modules directly (since we're in main process)
    const providerFiles = fs.readdirSync(providersPath)
      .filter(file => file.endsWith('.js') && file !== 'index.js');
    
    for (const file of providerFiles) {
      try {
        // Remove .js extension to get the provider ID
        const providerId = file.replace('.js', '');
        
        // Initialize empty settings for this provider
        emptySettings.providers[providerId] = {
          enabled: false,
          apiKey: ""
        };
      } catch (error) {
        console.error(`Error loading provider from ${file}:`, error);
      }
    }
    
    // Set default provider
    emptySettings.defaultProvider = "openai";
    emptySettings.defaultModel = "gpt-4o-mini";
    
    saveSettings(emptySettings);
  }
};

// Cache of loaded provider modules
const providerModules = {};

// Load a provider module (lazy loading)
const loadProviderModule = (providerId) => {
  if (!providerModules[providerId]) {
    try {
      const providerPath = path.join(providersPath, `${providerId}.js`);
      if (fs.existsSync(providerPath)) {
        providerModules[providerId] = require(providerPath);
      } else {
        console.error(`Provider module not found: ${providerId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error loading provider ${providerId}:`, error);
      return null;
    }
  }
  return providerModules[providerId].default;
};

// Find provider ID for a model
const findProviderForModel = (modelId) => {
  if (!modelId) return 'openai';
  
  // Load all provider modules if needed
  if (Object.keys(providerModules).length === 0) {
    const providerFiles = fs.readdirSync(providersPath)
      .filter(file => file.endsWith('.js') && file !== 'index.js');
    
    for (const file of providerFiles) {
      const providerId = file.replace('.js', '');
      loadProviderModule(providerId);
    }
  }
  
  // Check each provider
  for (const [providerId, provider] of Object.entries(providerModules)) {
    // Check if this provider has this exact model
    if (provider.default.models.some(model => model.id === modelId)) {
      return providerId;
    }
    
    // Check by model identifiers
    if (provider.default.modelIdentifiers.some(identifier => modelId.includes(identifier))) {
      return providerId;
    }
  }
  
  // Default to OpenAI
  return 'openai';
};

let mainWindow;

const createWindow = () => {
  // Clear sensitive data if first run in production
  clearSensitiveData();
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// API call handling
ipcMain.handle('call-api', async (event, { endpoint, model, prompt, params }) => {
  try {
    console.log(`Making API call to ${endpoint} with model ${model}`);
    console.log(`Prompt length: ${prompt.length} characters`);
    console.log(`Params: ${JSON.stringify(params)}`);
    
    // Load settings to get API keys
    const settings = loadSettings();
    
    // Find provider for this model
    const providerId = findProviderForModel(model);
    console.log(`Provider for ${model}: ${providerId}`);
    
    // Load the provider module
    const provider = loadProviderModule(providerId);
    if (!provider) {
      throw new Error(`Provider not found for model: ${model}`);
    }
    
    // Get API key for the provider
    const apiKey = settings.providers[providerId]?.apiKey;
    console.log(`API key present for ${providerId}: ${!!apiKey}`);
    
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${providerId}. Please configure it in settings.`);
    }
    
    // Call the provider's API implementation
    const response = await provider.callAPI(model, prompt, params, apiKey);
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      text: `Error: ${error.message}`,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

// Get providers info for settings UI
ipcMain.handle('get-providers-info', async () => {
  try {
    const providerFiles = fs.readdirSync(providersPath)
      .filter(file => file.endsWith('.js') && file !== 'index.js');
    
    const providersInfo = {};
    
    for (const file of providerFiles) {
      const providerId = file.replace('.js', '');
      const provider = loadProviderModule(providerId);
      
      if (provider) {
        providersInfo[providerId] = {
          id: provider.id,
          name: provider.name,
          description: provider.description,
          icon: provider.icon,
          url: provider.url,
          models: provider.models,
          defaultModel: provider.defaultModel
        };
      }
    }
    
    return providersInfo;
  } catch (error) {
    console.error('Error getting providers info:', error);
    return {};
  }
});

// Save settings handler
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    console.log('Saving settings from renderer process');
    saveSettings(settings);
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
});

// Load settings handler
ipcMain.handle('load-settings', async () => {
  return loadSettings();
}); 