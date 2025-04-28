import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { createExecutionOrder, processNode } from '../utils/apiService';
import { getSettings } from '../utils/settingsService';
import { useTheme } from '@mui/material/styles';

import InputNode from './nodes/InputNode';
import ModelNode from './nodes/ModelNode';
import OutputNode from './nodes/OutputNode';
import CustomNode from './nodes/CustomNode';

// Register custom node types
const nodeTypes = {
  input: InputNode,
  model: ModelNode,
  output: OutputNode,
  custom: CustomNode,
};

// Get default provider and model from settings
const getDefaultProviderModel = () => {
  const settings = getSettings();
  const defaultProvider = settings.defaultProvider || 'openai';
  const defaultModel = settings.defaultModel || 'gpt-3.5-turbo';
  
  // Find the first enabled provider if the default is not enabled
  if (!settings.providers[defaultProvider]?.enabled) {
    const enabledProvider = Object.entries(settings.providers)
      .find(([_, provider]) => provider.enabled);
    
    if (enabledProvider) {
      const [providerId, provider] = enabledProvider;
      return {
        providerId,
        model: provider.models[0]?.id || ''
      };
    }
  }
  
  return {
    providerId: defaultProvider,
    model: defaultModel
  };
};

const { providerId: defaultProviderId, model: defaultModel } = getDefaultProviderModel();

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { 
      label: 'Input Prompt',
      content: 'Write a short story about a robot learning to paint.',
      nodeType: 'input'
    },
    position: { x: 250, y: 50 },
  },
  {
    id: '2',
    type: 'model',
    data: { 
      label: 'GPT-4', 
      providerId: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
      nodeType: 'model'
    },
    position: { x: 250, y: 150 },
  },
  {
    id: '3',
    type: 'model',
    data: { 
      label: 'Feedback Model', 
      providerId: 'anthropic',
      model: 'claude-2',
      content: 'Assess the quality of the story and suggest improvements.',
      temperature: 0.3,
      maxTokens: 200,
      nodeType: 'model'
    },
    position: { x: 100, y: 250 },
  },
  {
    id: '4',
    type: 'model',
    data: { 
      label: 'Refinement Model', 
      providerId: 'openai',
      model: 'gpt-4',
      content: 'Rewrite the story based on feedback.',
      temperature: 0.5,
      maxTokens: 600,
      nodeType: 'model'
    },
    position: { x: 400, y: 250 },
  },
  {
    id: '5',
    type: 'output',
    data: { 
      label: 'Final Output',
      nodeType: 'output'
    },
    position: { x: 250, y: 350 },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
];

const FlowEditor = ({ 
  onNodeSelect, 
  running, 
  results, 
  onUpdateResults, 
  onUpdateNodeData,
  onFlowNodesChange,
  onRegisterUpdateNodeData
}) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [executionOrder, setExecutionOrder] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  // Use a ref to track the current running state to avoid stale closures
  const runningRef = useRef(running);
  // Store node results temporarily to avoid direct state updates during execution
  const nodeResultsRef = useRef({});
  // Flag to prevent multiple execution calls
  const executionStartedRef = useRef(false);
  
  // Get theme mode
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Register the handleUpdateNodeData function with the parent component
  useEffect(() => {
    if (onRegisterUpdateNodeData) {
      onRegisterUpdateNodeData(handleUpdateNodeData);
    }
  }, [onRegisterUpdateNodeData]);

  // Send nodes to parent component when they change
  useEffect(() => {
    if (onFlowNodesChange) {
      onFlowNodesChange(nodes);
    }
  }, [nodes, onFlowNodesChange]);

  // Keep the ref updated with the latest running value
  useEffect(() => {
    runningRef.current = running;
    // Reset execution started flag when running changes to false
    if (!running) {
      executionStartedRef.current = false;
    }
  }, [running]);

  // Update nodes when results change
  useEffect(() => {
    if (Object.keys(results).length > 0) {
      setNodes((nds) =>
        nds.map((node) => {
          if (results[node.id]) {
            // Create a new data object to ensure React detects the change
            return {
              ...node,
              data: {
                ...node.data,
                result: results[node.id],
              }
            };
          }
          return node;
        })
      );
    }
  }, [results, setNodes]);

  // Handle node execution - this effect only triggers execution once
  useEffect(() => {
    // Only start execution if running=true, not already executing, and hasn't started yet
    if (running && !isExecuting && !executionStartedRef.current) {
      setIsExecuting(true);
      executionStartedRef.current = true;
      
      // Reset node results for this execution
      nodeResultsRef.current = {};
      
      // Execute the flow
      const executeFlow = async () => {
        try {
          // Calculate execution order based on the DAG
          const order = createExecutionOrder(nodes, edges);
          setExecutionOrder(order);
          
          // Process nodes in order
          for (const nodeId of order) {
            // Check if we should stop execution
            if (!runningRef.current) {
              console.log('Execution stopped by user');
              break;
            }
            
            const node = nodes.find(n => n.id === nodeId);
            if (!node) continue;
            
            // Get input edges for this node
            const inputEdges = edges.filter(e => e.target === nodeId);
            
            // Process this node
            const result = await processNode(node, nodeResultsRef.current, inputEdges, nodes);
            
            // Store the result in our ref
            nodeResultsRef.current[nodeId] = result;
            
            // Update the UI via callback
            onUpdateResults(nodeId, result);
            
            // Small delay for visualization purposes
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error('Error executing flow:', error);
        } finally {
          setIsExecuting(false);
        }
      };
      
      executeFlow();
    }
  }, [running, nodes, edges, onUpdateResults, isExecuting]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_, node) => {
      // Enforce unselecting other nodes to avoid selection conflicts
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === node.id
        }))
      );
      onNodeSelect(node.id);
    },
    [onNodeSelect, setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // Generate a unique ID
      const newNodeId = uuidv4();
      
      // Create base node data
      let nodeData = { 
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        nodeType: type
      };
      
      // Add model-specific properties if it's a model node
      if (type === 'model') {
        nodeData = {
          ...nodeData,
          providerId: defaultProviderId,
          model: defaultModel,
          temperature: 0.7,
          maxTokens: 500,
        };
      }
      
      // Create the new node
      const newNode = {
        id: newNodeId,
        type,
        position,
        data: nodeData
      };

      setNodes((nds) => nds.concat(newNode));
      
      // If it's a model node, set the provider attribute immediately
      if (type === 'model' && nodeData.providerId) {
        setTimeout(() => {
          const element = document.querySelector(`[data-id="${newNodeId}"]`);
          if (element) {
            element.setAttribute('data-provider', nodeData.providerId);
          }
        }, 50);
      }
    },
    [reactFlowInstance, setNodes]
  );

  // Handle node data updates from sidebar
  const handleUpdateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData
            }
          };
        }
        return node;
      })
    );
    
    // If provider changed, update the node's appearance immediately
    if (newData.providerId) {
      setTimeout(() => {
        const element = document.querySelector(`[data-id="${nodeId}"]`);
        if (element) {
          element.setAttribute('data-provider', newData.providerId);
        }
      }, 50);
    }
  }, [setNodes]);

  // Add data-provider attribute to model nodes for styling
  const onNodeDragStop = useCallback((_, node) => {
    if (node.type === 'model' && node.data?.providerId) {
      const element = document.querySelector(`[data-id="${node.id}"]`);
      if (element) {
        element.setAttribute('data-provider', node.data.providerId);
      }
    }
  }, []);

  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
    
    // Set provider attributes on initial load
    setTimeout(() => {
      nodes.forEach(node => {
        if (node.type === 'model' && node.data?.providerId) {
          const element = document.querySelector(`[data-id="${node.id}"]`);
          if (element) {
            element.setAttribute('data-provider', node.data.providerId);
          }
        }
      });
    }, 100);
  }, [nodes]);

  // Handle clicking on the background to deselect all nodes
  const onPaneClick = useCallback(() => {
    // Immediately deselect any selected node
    onNodeSelect(null);
    
    // Also clear any internal selection state in ReactFlow
    setNodes((nds) =>
      nds.map((node) => {
        if (node.selected) {
          return {
            ...node,
            selected: false
          };
        }
        return node;
      })
    );
  }, [onNodeSelect, setNodes]);

  // Handle the case when multiple nodes are selected
  const onSelectionChange = useCallback(({ nodes }) => {
    if (nodes.length === 1) {
      onNodeSelect(nodes[0].id);
    } else if (nodes.length > 1) {
      // Multiple nodes selected
      onNodeSelect('multiple');
    }
  }, [onNodeSelect]);

  return (
    <div className="dndflow" style={{ height: '100%' }}>
      <ReactFlowProvider>
        <div 
          className="reactflow-wrapper" 
          ref={reactFlowWrapper}
          data-dark-mode={isDarkMode}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            onSelectionChange={onSelectionChange}
            multiSelectionKeyCode="Control"
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background color={isDarkMode ? '#555' : '#aaa'} gap={16} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default FlowEditor; 