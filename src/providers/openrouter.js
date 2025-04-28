/**
 * OpenRouter Provider Implementation
 */

const openrouterProvider = {
  id: 'openrouter',
  name: 'OpenRouter',
  description: 'OpenRouter API provider - access to multiple LLM providers',
  icon: 'openrouter.svg',
  url: 'https://openrouter.ai/',
  
  // Keywords to identify models from this provider
  modelIdentifiers: ['openrouter'],
  
  // Available models
  models: [
    { id: "openrouter/auto", name: "OpenRouter Auto" },
    { id: "openrouter/mix", name: "OpenRouter Mix" }
  ],
  
  // Default model
  defaultModel: "openrouter/auto",
  
  // Configuration settings
  settingsSchema: {
    apiKey: {
      type: 'string',
      format: 'password',
      title: 'API Key',
      description: 'Your OpenRouter API key from openrouter.ai',
      required: true
    }
  },
  
  // Main implementation function (Node.js/main process)
  async callAPI(model, prompt, params, apiKey) {
    // Implementation for OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://promptchain.app',
        'X-Title': 'PromptChain'
      },
      body: JSON.stringify({
        model: model.replace('openrouter/', ''),
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
      throw new Error(result.error?.message || 'OpenRouter API call failed');
    }
    
    return {
      success: true,
      text: result.choices[0].message.content,
      model: model,
      timestamp: new Date().toISOString(),
      routedModel: result.model,
      usage: result.usage
    };
  }
};

export default openrouterProvider; 