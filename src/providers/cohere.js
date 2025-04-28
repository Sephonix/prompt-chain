/**
 * Cohere Provider Implementation
 */

const cohereProvider = {
  id: 'cohere',
  name: 'Cohere',
  description: 'Cohere API provider',
  icon: 'cohere.svg',
  url: 'https://dashboard.cohere.com/',
  
  // Keywords to identify models from this provider
  modelIdentifiers: ['command'],
  
  // Available models
  models: [
    { id: "command", name: "Command" },
    { id: "command-light", name: "Command Light" },
    { id: "command-nightly", name: "Command Nightly" }
  ],
  
  // Default model
  defaultModel: "command",
  
  // Configuration settings
  settingsSchema: {
    apiKey: {
      type: 'string',
      format: 'password',
      title: 'API Key',
      description: 'Your Cohere API key from dashboard.cohere.com',
      required: true
    }
  },
  
  // Main implementation function (Node.js/main process)
  async callAPI(model, prompt, params, apiKey) {
    // Using fetch directly for Cohere API
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Cohere-Version': '2022-12-06'
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 500
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Cohere API call failed');
    }
    
    return {
      success: true,
      text: result.generations[0].text,
      model: model,
      timestamp: new Date().toISOString()
    };
  }
};

export default cohereProvider; 