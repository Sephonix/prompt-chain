/**
 * Anthropic Provider Implementation
 */

const anthropicProvider = {
  id: 'anthropic',
  name: 'Anthropic',
  description: 'Anthropic API provider for Claude models',
  icon: 'anthropic.svg',
  url: 'https://console.anthropic.com/',
  
  // Keywords to identify models from this provider
  modelIdentifiers: ['claude'],
  
  // Available models
  models: [
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
    { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
    { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet" }
  ],
  
  // Default model
  defaultModel: "claude-3-haiku-20240307",
  
  // Configuration settings
  settingsSchema: {
    apiKey: {
      type: 'string',
      format: 'password',
      title: 'API Key',
      description: 'Your Anthropic API key from console.anthropic.com',
      required: true
    }
  },
  
  // Main implementation function (Node.js/main process)
  async callAPI(model, prompt, params, apiKey) {
    const { Anthropic } = require('@anthropic-ai/sdk');
    
    const anthropic = new Anthropic({ apiKey });
    
    const message = await anthropic.messages.create({
      model: model,
      system: "You are a helpful assistant.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: params.max_tokens || 500,
      temperature: params.temperature || 0.7
    });
    
    return {
      success: true,
      text: message.content[0].text,
      model: model,
      timestamp: new Date().toISOString(),
      usage: {
        prompt_tokens: message.usage.input_tokens,
        completion_tokens: message.usage.output_tokens,
        total_tokens: message.usage.input_tokens + message.usage.output_tokens
      }
    };
  }
};

module.exports = { default: anthropicProvider }; 