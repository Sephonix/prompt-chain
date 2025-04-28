import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Divider, TextField, Select, MenuItem, InputLabel, FormControl, useTheme } from '@mui/material';
import ModelSelector from './ModelSelector';

const NodeConfig = ({ nodeId, nodes, onUpdateNodeData }) => {
  // Add key prop reset mechanism
  const [configKey, setConfigKey] = React.useState(0);
  
  // Reset component state when nodeId changes
  React.useEffect(() => {
    setConfigKey(prevKey => prevKey + 1);
  }, [nodeId]);
  
  // Handle case when multiple nodes are selected
  if (nodeId === 'multiple') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Multiple Nodes Selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You can only configure a single node at a time. 
          Please select only one node to edit its properties.
        </Typography>
      </Box>
    );
  }
  
  const node = nodes?.find(n => n.id === nodeId);
  
  if (!node) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Select a node to configure it
        </Typography>
      </Box>
    );
  }

  // Handler for updating node data
  const handleChange = (newData) => {
    if (onUpdateNodeData) {
      onUpdateNodeData(nodeId, newData);
    }
  };

  // Render different configuration options based on node type
  switch (node.type) {
    case 'input':
      return (
        <Box sx={{ p: 2 }} key={configKey}>
          <TextField
            key={`name-${nodeId}-${configKey}`}
            label="Node Name"
            fullWidth
            margin="normal"
            variant="outlined"
            defaultValue={node.data.label || ''}
            onChange={(e) => handleChange({ label: e.target.value })}
          />
          <TextField
            key={`content-${nodeId}-${configKey}`}
            label="Prompt Text"
            multiline
            rows={4}
            fullWidth
            margin="normal"
            variant="outlined"
            defaultValue={node.data.content || ''}
            onChange={(e) => handleChange({ content: e.target.value })}
          />
        </Box>
      );
    case 'model':
      return (
        <Box sx={{ p: 2 }} key={configKey}>
          <TextField
            key={`name-${nodeId}-${configKey}`}
            label="Node Name"
            fullWidth
            margin="normal"
            variant="outlined"
            defaultValue={node.data.label || ''}
            onChange={(e) => handleChange({ label: e.target.value })}
          />
          <ModelSelector 
            key={`model-${nodeId}-${configKey}`}
            data={node.data} 
            onChange={(newData) => handleChange(newData)}
          />
        </Box>
      );
    case 'output':
      return (
        <Box sx={{ p: 2 }} key={configKey}>
          <TextField
            key={`name-${nodeId}-${configKey}`}
            label="Node Name"
            fullWidth
            margin="normal"
            variant="outlined"
            defaultValue={node.data.label || ''}
            onChange={(e) => handleChange({ label: e.target.value })}
          />
          {node.data.result ? (
            <TextField
              key={`result-${nodeId}-${configKey}`}
              label="Output"
              multiline
              rows={6}
              fullWidth
              margin="normal"
              variant="outlined"
              value={node.data.result.text || ''}
              InputProps={{
                readOnly: true,
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No output generated yet
            </Typography>
          )}
        </Box>
      );
    default:
      return (
        <Box sx={{ p: 2 }} key={configKey}>
          <TextField
            key={`name-${nodeId}-${configKey}`}
            label="Node Name"
            fullWidth
            margin="normal"
            variant="outlined"
            defaultValue={node.data.label || ''}
            onChange={(e) => handleChange({ label: e.target.value })}
          />
          <Typography variant="body2" color="text.secondary">
            Configuration options for this node type are not available.
          </Typography>
        </Box>
      );
  }
};

const Sidebar = ({ selectedNodeId, onUpdateNodeData, nodes }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Node type colors that match the flow graph in both light and dark modes
  const nodeColors = {
    input: {
      bg: isDarkMode ? '#003b4a' : '#d4f1f9',
      border: isDarkMode ? '#0097c0' : '#75c7e6',
      text: isDarkMode ? '#f8f8f8' : '#222'
    },
    model: {
      bg: isDarkMode ? '#400040' : '#f9d4f9',
      border: isDarkMode ? '#c000c0' : '#e675e6',
      text: isDarkMode ? '#f8f8f8' : '#222'
    },
    output: {
      bg: isDarkMode ? '#004000' : '#d4f9d4',
      border: isDarkMode ? '#00c000' : '#75e675',
      text: isDarkMode ? '#f8f8f8' : '#222'
    },
    custom: {
      bg: isDarkMode ? '#404000' : '#f9f9d4',
      border: isDarkMode ? '#c0c000' : '#e6e675',
      text: isDarkMode ? '#f8f8f8' : '#222'
    }
  };
  
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Box sx={{ 
      width: 300, 
      height: '100%',
      borderRight: 1,
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* <Box sx={{ p: 2 }}>
        <Typography variant="h6">Prompt Chain</Typography>
        <Typography variant="body2" color="text.secondary">
          Build your text generation workflow
        </Typography>
      </Box>
      
      <Divider /> */}
      
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Node Types
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            className="dndnode input"
            onDragStart={(event) => onDragStart(event, 'input')}
            draggable
            sx={{
              p: 1,
              border: `1px solid ${nodeColors.input.border}`,
              bgcolor: nodeColors.input.bg,
              color: nodeColors.input.text,
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'grab'
            }}
          >
            Input
          </Box>
          <Box
            className="dndnode"
            onDragStart={(event) => onDragStart(event, 'model')}
            draggable
            sx={{
              p: 1,
              border: `1px solid ${nodeColors.model.border}`,
              bgcolor: nodeColors.model.bg,
              color: nodeColors.model.text,
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'grab'
            }}
          >
            Model
          </Box>
          <Box
            className="dndnode output"
            onDragStart={(event) => onDragStart(event, 'output')}
            draggable
            sx={{
              p: 1,
              border: `1px solid ${nodeColors.output.border}`,
              bgcolor: nodeColors.output.bg,
              color: nodeColors.output.text,
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'grab'
            }}
          >
            Output
          </Box>
          <Box
            className="dndnode custom"
            onDragStart={(event) => onDragStart(event, 'custom')}
            draggable
            sx={{
              p: 1,
              border: `1px solid ${nodeColors.custom.border}`,
              bgcolor: nodeColors.custom.bg,
              color: nodeColors.custom.text,
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'grab'
            }}
          >
            Custom
          </Box>
        </Box>
      </Box>
      
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <NodeConfig 
          nodeId={selectedNodeId} 
          nodes={nodes} 
          onUpdateNodeData={onUpdateNodeData}
        />
      </Box>
    </Box>
  );
};

export default Sidebar; 