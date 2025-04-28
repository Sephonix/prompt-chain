import React, { memo, useState, useEffect } from 'react';
import { getProviderName } from '../../utils/settingsService';
import BaseNode from './BaseNode';
import ViewGenerationDialog from '../ViewGenerationDialog';
import { Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Import provider icons
import openaiIcon from '../../assets/icons/openai.svg';
import anthropicIcon from '../../assets/icons/anthropic.svg';
import mistralaiIcon from '../../assets/icons/mistralai.svg';
import cohereIcon from '../../assets/icons/cohere.svg';
import deepseekIcon from '../../assets/icons/deepseek.svg';
import grokIcon from '../../assets/icons/grok.svg';
import openrouterIcon from '../../assets/icons/openrouter.svg';

const ModelNode = ({ data }) => {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [providerDisplayName, setProviderDisplayName] = useState(data.providerId || '');
  
  // Get the appropriate icon for this provider
  const getProviderIcon = () => {
    const icons = {
      openai: openaiIcon,
      anthropic: anthropicIcon,
      mistral: mistralaiIcon,
      cohere: cohereIcon,
      deepseek: deepseekIcon,
      grok: grokIcon,
      openrouter: openrouterIcon
    };
    
    return icons[data.providerId] || null;
  };
  
  // Load provider name asynchronously
  useEffect(() => {
    if (data.providerId) {
      const loadProviderName = async () => {
        try {
          const name = await getProviderName(data.providerId);
          setProviderDisplayName(name);
        } catch (error) {
          console.error('Error loading provider name:', error);
          setProviderDisplayName(data.providerId); // Fallback to ID
        }
      };
      
      loadProviderName();
    }
  }, [data.providerId]);
  
  const handleOpenViewDialog = (e) => {
    // Stop event propagation to prevent node selection
    e.stopPropagation();
    setViewDialogOpen(true);
  };
  
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
  };

  return (
    <>
      <BaseNode data={data}>
        <div className="node-header">
          {data.providerId && (
            <div className="provider-badge">
              {getProviderIcon() && (
                <img 
                  src={getProviderIcon()} 
                  alt={`${providerDisplayName} logo`}
                  className="provider-icon"
                />
              )}
              <span className="provider-name">{providerDisplayName}</span>
            </div>
          )}
          {data.label}
        </div>
        <div className="node-body">
          {data.content 
            ? `System prompt: ${data.content}` 
            : `Model: ${data.model || 'Not specified'}, Temp: ${data.temperature || 0.7}`
          }
        </div>
        <div className="node-footer">
          {data.result && (
            <>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<VisibilityIcon />}
                onClick={handleOpenViewDialog}
                sx={{ 
                  fontSize: '0.7rem', 
                  py: 0, 
                  textTransform: 'none',
                  borderColor: 'rgba(125, 125, 125, 0.3)',
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    borderColor: 'primary.main'
                  }
                }}
              >
                View Generation
              </Button>
              <span className="timestamp">Generated at: {new Date(data.result.timestamp).toLocaleTimeString()}</span>
            </>
          )}
          {!data.result && data.providerId && (
            <span className="model-info">
              {data.model || 'Default model'}
            </span>
          )}
        </div>
      </BaseNode>
      
      <ViewGenerationDialog 
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        nodeData={data}
      />
    </>
  );
};

export default memo(ModelNode); 