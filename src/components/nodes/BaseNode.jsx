import React from 'react';
import { Handle, Position } from 'reactflow';

const BaseNode = ({ data, children, inputHandles = 1, outputHandles = 1 }) => {
  const nodeType = data.nodeType || 'custom';
  
  const getNodeTypeBadge = () => {
    // Node type badge configuration
    const badgeConfig = {
      input: { bg: '#75c7e6', text: '#fff' },
      model: { bg: '#e675e6', text: '#fff' },
      output: { bg: '#75e675', text: '#fff' },
      custom: { bg: '#e6e675', text: '#333' },
    };
    
    const config = badgeConfig[nodeType] || badgeConfig.custom;
    
    return {
      position: 'absolute',
      top: '2px',
      left: '2px',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 'bold',
      backgroundColor: config.bg,
      color: config.text,
      textTransform: 'uppercase',
      zIndex: 10
    };
  };
  
  // Create multiple handles if needed
  const renderInputHandles = () => {
    if (inputHandles <= 1) {
      return <Handle type="target" position={Position.Top} id="a" />;
    }
    
    const handles = [];
    const step = 1 / (inputHandles + 1);
    
    for (let i = 1; i <= inputHandles; i++) {
      handles.push(
        <Handle 
          key={`input-${i}`}
          type="target" 
          position={Position.Top} 
          id={`input-${i}`} 
          style={{ left: `${step * i * 100}%` }}
        />
      );
    }
    
    return handles;
  };
  
  const renderOutputHandles = () => {
    if (outputHandles <= 1) {
      return <Handle type="source" position={Position.Bottom} id="b" />;
    }
    
    const handles = [];
    const step = 1 / (outputHandles + 1);
    
    for (let i = 1; i <= outputHandles; i++) {
      handles.push(
        <Handle 
          key={`output-${i}`}
          type="source" 
          position={Position.Bottom} 
          id={`output-${i}`} 
          style={{ left: `${step * i * 100}%` }}
        />
      );
    }
    
    return handles;
  };
  
  return (
    <div className="node-content">
      <div style={getNodeTypeBadge()}>
        {nodeType}
      </div>
      {children}
      {renderInputHandles()}
      {renderOutputHandles()}
    </div>
  );
};

export default BaseNode; 