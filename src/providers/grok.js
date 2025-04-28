/**
 * Grok Provider Implementation
 */

const grokProvider = {
  id: 'grok',
  name: 'Grok',
  description: 'Grok API provider by xAI',
  icon: 'grok.svg',
  url: 'https://x.ai/',
  
  // Keywords to identify models from this provider
  modelIdentifiers: ['grok'],
  
  // Available models
  models: [
    { id: "grok-1", name: "Grok-1" }
  ],
  
  // Default model
  defaultModel: "grok-1",
  
  // Configuration settings
  settingsSchema: {
    apiKey: {
      type: 'string',
      format: 'password',
      title: 'API Key',
      description: 'Your Grok API key',
      required: true
    }
  },
  
  // Main implementation function (Node.js/main process)
  async callAPI(model, prompt, params, apiKey) {
    // Implementation for Grok API
    const response = await fetch('https://api.grok.ai/v1/chat/completions', {
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
      throw new Error(result.error?.message || 'Grok API call failed');
    }
    
    return {
      success: true,
      text: result.choices[0].message.content,
      model: model,
      timestamp: new Date().toISOString()
    };
  }
};

export default grokProvider; 