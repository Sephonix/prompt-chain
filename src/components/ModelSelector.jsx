import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Slider,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { getSettings, getAvailableModels, getProviderName } from '../utils/settingsService';

// Import provider icons
import openaiIcon from '../assets/icons/openai.svg';
import anthropicIcon from '../assets/icons/anthropic.svg';
import mistralaiIcon from '../assets/icons/mistralai.svg';
import cohereIcon from '../assets/icons/cohere.svg';
import deepseekIcon from '../assets/icons/deepseek.svg';
import grokIcon from '../assets/icons/grok.svg';
import openrouterIcon from '../assets/icons/openrouter.svg';

const ModelSelector = ({ data, onChange }) => {
  const [availableProviders, setAvailableProviders] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(data.providerId || 'openai');
  const [selectedModel, setSelectedModel] = useState(data.model || '');
  const [temperature, setTemperature] = useState(data.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(data.maxTokens || 500);
  const [systemPrompt, setSystemPrompt] = useState(data.content || '');
  const [loading, setLoading] = useState(true);
  const [providerNames, setProviderNames] = useState({});

  // Load available providers and models on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await getSettings();
        const enabledProviders = Object.entries(settings.providers)
          .filter(([_, provider]) => provider.enabled)
          .map(([id, _]) => id);
        
        setAvailableProviders(enabledProviders);
        
        // Load provider names
        const names = {};
        for (const providerId of enabledProviders) {
          names[providerId] = await getProviderName(providerId);
        }
        setProviderNames(names);
        
        // Set models for the selected provider
        await updateAvailableModels(selectedProvider);
        
        // If no provider is selected yet, use the first available one
        if (!data.providerId && enabledProviders.length > 0) {
          await handleProviderChange(enabledProviders[0]);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Fetch all models for the selected provider
  const updateAvailableModels = async (providerId) => {
    try {
      const settings = await getSettings();
      const provider = settings.providers[providerId];
      
      if (provider && provider.enabled) {
        // Get provider info from main process
        const providersInfo = await window.electron.ipcRenderer.invoke('get-providers-info');
        const providerModels = providersInfo[providerId]?.models || [];
        
        setAvailableModels(providerModels);
        
        // If current model doesn't exist in this provider, select first available
        const modelExists = providerModels.some(m => m.id === selectedModel);
        if (!modelExists && providerModels.length > 0) {
          setSelectedModel(providerModels[0].id);
          if (onChange) {
            onChange({
              ...data,
              providerId,
              model: providerModels[0].id
            });
          }
        }
      } else {
        setAvailableModels([]);
      }
    } catch (error) {
      console.error('Error updating available models:', error);
      setAvailableModels([]);
    }
  };

  // Get the appropriate icon for a provider
  const getProviderIcon = (providerId) => {
    const icons = {
      openai: openaiIcon,
      anthropic: anthropicIcon,
      mistral: mistralaiIcon,
      cohere: cohereIcon,
      deepseek: deepseekIcon,
      grok: grokIcon,
      openrouter: openrouterIcon
    };
    
    return icons[providerId] || null;
  };

  // Handle provider change
  const handleProviderChange = async (providerId) => {
    setSelectedProvider(providerId);
    await updateAvailableModels(providerId);
    
    if (onChange) {
      onChange({
        ...data,
        providerId
      });
    }
  };

  // Handle model change
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    
    if (onChange) {
      onChange({
        ...data,
        model: modelId
      });
    }
  };

  // Handle temperature change
  const handleTemperatureChange = (event, newValue) => {
    setTemperature(newValue);
    
    if (onChange) {
      onChange({
        ...data,
        temperature: newValue
      });
    }
  };

  // Handle max tokens change
  const handleMaxTokensChange = (event, newValue) => {
    setMaxTokens(newValue);
    
    if (onChange) {
      onChange({
        ...data,
        maxTokens: newValue
      });
    }
  };

  // Handle system prompt change
  const handleSystemPromptChange = (event) => {
    setSystemPrompt(event.target.value);
    
    if (onChange) {
      onChange({
        ...data,
        content: event.target.value
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading model settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Model Configuration</Typography>
      
      {availableProviders.length === 0 ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No API providers are enabled. Please configure at least one provider in the settings.
        </Alert>
      ) : (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel id="provider-select-label">Provider</InputLabel>
            <Select
              labelId="provider-select-label"
              id="provider-select"
              value={selectedProvider}
              label="Provider"
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {availableProviders.map(providerId => (
                <MenuItem key={providerId} value={providerId}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getProviderIcon(providerId) && (
                      <Box 
                        component="img" 
                        src={getProviderIcon(providerId)} 
                        alt={`${providerNames[providerId] || providerId} logo`}
                        sx={{ width: 20, height: 20, mr: 1 }}
                      />
                    )}
                    {providerNames[providerId] || providerId}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="model-select-label">Model</InputLabel>
            <Select
              labelId="model-select-label"
              id="model-select"
              value={selectedModel}
              label="Model"
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={availableModels.length === 0}
            >
              {availableModels.map(model => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography gutterBottom>Temperature: {temperature}</Typography>
          <Slider
            value={temperature}
            onChange={handleTemperatureChange}
            step={0.1}
            marks
            min={0}
            max={1}
            valueLabelDisplay="auto"
          />
          
          <Typography gutterBottom sx={{ mt: 2 }}>Max Tokens: {maxTokens}</Typography>
          <Slider
            value={maxTokens}
            onChange={handleMaxTokensChange}
            step={100}
            marks
            min={100}
            max={2000}
            valueLabelDisplay="auto"
          />
          
          <TextField
            label="System Prompt"
            multiline
            rows={4}
            fullWidth
            margin="normal"
            variant="outlined"
            value={systemPrompt}
            onChange={handleSystemPromptChange}
            placeholder="Instructions for the model..."
          />
        </>
      )}
    </Box>
  );
};

export default ModelSelector; 