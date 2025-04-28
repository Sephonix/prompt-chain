import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  getSettings, 
  saveSettings, 
  updateProviderSettings, 
  getProviderName
} from '../utils/settingsService';

// Import provider icons
import openaiIcon from '../assets/icons/openai.svg';
import anthropicIcon from '../assets/icons/anthropic.svg';
import mistralaiIcon from '../assets/icons/mistralai.svg';
import cohereIcon from '../assets/icons/cohere.svg';
import deepseekIcon from '../assets/icons/deepseek.svg';
import grokIcon from '../assets/icons/grok.svg';
import openrouterIcon from '../assets/icons/openrouter.svg';

// Provider configuration component
const ProviderSettings = ({ providerId, settings, onChange }) => {
  const provider = settings.providers[providerId];
  
  // Get the appropriate icon for this provider
  const getProviderIcon = () => {
    const icons = {
      openai: openaiIcon,
      anthropic: anthropicIcon,
      mistralai: mistralaiIcon,
      cohere: cohereIcon,
      deepseek: deepseekIcon,
      grok: grokIcon,
      openrouter: openrouterIcon
    };
    
    return icons[providerId] || null;
  };
  
  const handleToggleEnable = (event) => {
    onChange(providerId, { enabled: event.target.checked });
  };

  const handleApiKeyChange = (event) => {
    onChange(providerId, { apiKey: event.target.value });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {getProviderIcon() && (
          <Box 
            component="img" 
            src={getProviderIcon()} 
            alt={`${getProviderName(providerId)} logo`}
            sx={{ width: 32, height: 32, mr: 2 }}
          />
        )}
        <Typography variant="h6" component="div">
          {getProviderName(providerId)} Settings
        </Typography>
      </Box>
      
      <FormControlLabel
        control={
          <Switch 
            checked={provider.enabled} 
            onChange={handleToggleEnable}
            color="primary"
          />
        }
        label="Enable this provider"
      />
      
      <TextField
        margin="normal"
        fullWidth
        id={`${providerId}-api-key`}
        label="API Key"
        type="password"
        value={provider.apiKey}
        onChange={handleApiKeyChange}
        disabled={!provider.enabled}
        helperText={`Enter your ${getProviderName(providerId)} API key`}
      />
      
      <Typography variant="subtitle2" sx={{ mt: 2 }}>
        Available Models:
      </Typography>
      
      <Box sx={{ ml: 2, mt: 1 }}>
        {provider.models.map(model => (
          <Typography key={model.id} variant="body2" sx={{ mb: 0.5 }}>
            • {model.name} ({model.id})
          </Typography>
        ))}
      </Box>
      
      {providerId === 'openai' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You can find your OpenAI API key in your account settings at platform.openai.com
        </Alert>
      )}
      
      {providerId === 'anthropic' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You can get your Anthropic API key at console.anthropic.com
        </Alert>
      )}
    </Box>
  );
};

// Main Settings Dialog component
const SettingsDialog = ({ open, onClose }) => {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('openai');
  const [saveStatus, setSaveStatus] = useState({ show: false, message: '', severity: 'success' });

  // Load settings on initial mount
  useEffect(() => {
    if (open) {
      setSettings(getSettings());
    }
  }, [open]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleProviderChange = (providerId, providerSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      providers: {
        ...prevSettings.providers,
        [providerId]: {
          ...prevSettings.providers[providerId],
          ...providerSettings
        }
      }
    }));
  };

  const handleSave = () => {
    try {
      saveSettings(settings);
      setSaveStatus({
        show: true,
        message: 'Settings saved successfully!',
        severity: 'success'
      });
      
      // Hide the success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      setSaveStatus({
        show: true,
        message: `Error saving settings: ${error.message}`,
        severity: 'error'
      });
    }
  };

  if (!settings) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">API Provider Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure your AI model providers
        </Typography>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', height: 400 }}>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={handleTabChange}
            sx={{ 
              borderRight: 1, 
              borderColor: 'divider',
              minWidth: 180
            }}
          >
            {Object.keys(settings.providers).map(providerId => (
              <Tab 
                key={providerId} 
                value={providerId} 
                label={getProviderName(providerId)}
                icon={
                  settings.providers[providerId].enabled ? (
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main',
                        position: 'absolute',
                        right: 10,
                        top: 10
                      }} 
                    />
                  ) : null
                }
                iconPosition="end"
              />
            ))}
          </Tabs>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {Object.keys(settings.providers).map(providerId => (
              <Box 
                key={providerId} 
                role="tabpanel"
                hidden={activeTab !== providerId}
                id={`provider-tabpanel-${providerId}`}
                sx={{ height: '100%' }}
              >
                {activeTab === providerId && (
                  <ProviderSettings 
                    providerId={providerId}
                    settings={settings}
                    onChange={handleProviderChange}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      
      {saveStatus.show && (
        <Alert severity={saveStatus.severity} sx={{ mx: 2, my: 1 }}>
          {saveStatus.message}
        </Alert>
      )}
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog; 