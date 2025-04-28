import React, { memo } from 'react';
import { getProviderName } from '../../utils/settingsService';
import BaseNode from './BaseNode';

// Import provider icons
import openaiIcon from '../../assets/icons/openai.svg';
import anthropicIcon from '../../assets/icons/anthropic.svg';
import mistralaiIcon from '../../assets/icons/mistralai.svg';
import cohereIcon from '../../assets/icons/cohere.svg';
import deepseekIcon from '../../assets/icons/deepseek.svg';
import grokIcon from '../../assets/icons/grok.svg';
import openrouterIcon from '../../assets/icons/openrouter.svg';

const ModelNode = ({ data }) => {
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
    
    return icons[data.providerId] || null;
  };

  return (
    <BaseNode data={data}>
      <div className="node-header">
        {data.providerId && (
          <div className="provider-badge">
            {getProviderIcon() && (
              <img 
                src={getProviderIcon()} 
                alt={`${getProviderName(data.providerId)} logo`}
                className="provider-icon"
              />
            )}
            <span className="provider-name">{getProviderName(data.providerId || 'openai')}</span>
          </div>
        )}
        {data.label}
      </div>
      <div className="node-body">
        {data.result 
          ? data.result.text 
          : (data.content 
              ? `System prompt: ${data.content}` 
              : `Model: ${data.model || 'Not specified'}, Temp: ${data.temperature || 0.7}`
            )
        }
      </div>
      <div className="node-footer">
        {data.result && (
          <span>Generated at: {new Date(data.result.timestamp).toLocaleTimeString()}</span>
        )}
        {!data.result && data.providerId && (
          <span className="model-info">
            {data.model || 'Default model'}
          </span>
        )}
      </div>
    </BaseNode>
  );
};

export default memo(ModelNode); 