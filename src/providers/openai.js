/**
 * OpenAI Provider Implementation
 */

const openaiProvider = {
  id: 'openai',
  name: 'OpenAI',
  description: 'OpenAI API provider for GPT models',
  icon: 'openai.svg',
  url: 'https://platform.openai.com/',
  
  // Keywords to identify models from this provider
  modelIdentifiers: ['gpt', 'o4'],
  
  // Available models
  models: [
    { id: "gpt-4.1-nano", name: "GPT-4.1 nano" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 mini" },
    { id: "o4-mini", name: "GPT-o4 mini" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o mini" }
  ],
  
  // Default model
  defaultModel: "gpt-4.1-nano",
  
  // Configuration settings
  settingsSchema: {
    apiKey: {
      type: 'string',
      format: 'password',
      title: 'API Key',
      description: 'Your OpenAI API key from platform.openai.com',
      required: true
    }
  },
  
  // Main implementation function (Node.js/main process)
  async callAPI(model, prompt, params, apiKey) {
    const { OpenAI } = require('openai');
    
    const openai = new OpenAI({ apiKey });
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: params.temperature || 0.7,
      max_tokens: params.max_tokens || 500
    });
    
    return {
      success: true,
      text: completion.choices[0].message.content,
      model: model,
      timestamp: new Date().toISOString(),
      usage: completion.usage
    };
  }
};

module.exports = { default: openaiProvider }; 