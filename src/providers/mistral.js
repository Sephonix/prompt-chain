/**
 * Mistral AI Provider Implementation
 */

const mistralProvider = {
  id: 'mistral',
  name: 'Mistral AI',
  description: 'Mistral AI API provider',
  icon: 'mistralai.svg',
  url: 'https://console.mistral.ai/',
  
  // Keywords to identify models from this provider
  modelIdentifiers: ['mistral'],
  
  // Available models
  models: [
    { id: "mistral-small", name: "Mistral Small" },
    { id: "mistral-medium", name: "Mistral Medium" },
    { id: "mistral-large", name: "Mistral Large" }
  ],
  
  // Default model
  defaultModel: "mistral-small",
  
  // Configuration settings
  settingsSchema: {
    apiKey: {
      type: 'string',
      format: 'password',
      title: 'API Key',
      description: 'Your Mistral AI API key from console.mistral.ai',
      required: true
    }
  },
  
  // Main implementation function (Node.js/main process)
  async callAPI(model, prompt, params, apiKey) {
    // Using fetch directly for Mistral API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 500
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Mistral API call failed');
    }
    
    return {
      success: true,
      text: result.choices[0].message.content,
      model: model,
      timestamp: new Date().toISOString(),
      usage: result.usage
    };
  }
};

export default mistralProvider; 