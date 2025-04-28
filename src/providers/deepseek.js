/**
 * DeepSeek Provider Implementation
 */

const deepseekProvider = {
  id: 'deepseek',
  name: 'DeepSeek',
  description: 'DeepSeek API provider',
  icon: 'deepseek.svg',
  url: 'https://platform.deepseek.com/',
  
  // Keywords to identify models from this provider
  modelIdentifiers: ['deepseek'],
  
  // Available models
  models: [
    { id: "deepseek-coder", name: "DeepSeek Coder" },
    { id: "deepseek-llm", name: "DeepSeek LLM" }
  ],
  
  // Default model
  defaultModel: "deepseek-coder",
  
  // Configuration settings
  settingsSchema: {
    apiKey: {
      type: 'string',
      format: 'password',
      title: 'API Key',
      description: 'Your DeepSeek API key from platform.deepseek.com',
      required: true
    }
  },
  
  // Main implementation function (Node.js/main process)
  async callAPI(model, prompt, params, apiKey) {
    // Implementation for DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
      throw new Error(result.error?.message || 'DeepSeek API call failed');
    }
    
    return {
      success: true,
      text: result.choices[0].message.content,
      model: model,
      timestamp: new Date().toISOString()
    };
  }
};

export default deepseekProvider; 