import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { createExecutionOrder, processNode } from '../utils/apiService';
import { getSettings } from '../utils/settingsService';
import { useTheme } from '@mui/material/styles';
import { Menu, MenuItem, Divider } from '@mui/material';

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

// Default values for initial rendering before settings are loaded
const defaultInitialModel = {
  providerId: 'openai',
  model: 'gpt-4o-mini'
};

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
      model: 'gpt-4o-mini',
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
      model: 'claude-3-haiku-20240307',
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
      model: 'gpt-4o-mini',
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
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  // Use a ref to track the current running state to avoid stale closures
  const runningRef = useRef(running);
  // Store node results temporarily to avoid direct state updates during execution
  const nodeResultsRef = useRef({});
  // Flag to prevent multiple execution calls
  const executionStartedRef = useRef(false);
  
  // State for context menu
  const [contextMenu, setContextMenu] = useState(null);
  
  // State for clipboard to store copied nodes
  const [nodeClipboard, setNodeClipboard] = useState(null);

  // Get theme mode
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        setSettingsLoaded(true);
        
        // Update default models in the initial nodes if needed
        if (settings && settings.providers) {
          setNodes(currentNodes => {
            return currentNodes.map(node => {
              if (node.type === 'model') {
                const providerId = node.data.providerId;
                // If this provider isn't enabled or doesn't exist, find an enabled one
                if (!settings.providers[providerId]?.enabled) {
                  const enabledProvider = Object.entries(settings.providers)
                    .find(([_, provider]) => provider.enabled);
                  
                  if (enabledProvider) {
                    const [newProviderId, provider] = enabledProvider;
                    const firstModel = provider.models[0]?.id || '';
                    
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        providerId: newProviderId,
                        model: firstModel
                      }
                    };
                  }
                }
                
                // Ensure the model exists for this provider
                const provider = settings.providers[providerId];
                if (provider && provider.enabled) {
                  const modelExists = provider.models.some(m => m.id === node.data.model);
                  if (!modelExists && provider.models.length > 0) {
                    return {
                      ...node,
                      data: {
                        ...node.data,
                        model: provider.models[0].id
                      }
                    };
                  }
                }
              }
              return node;
            });
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettingsLoaded(true); // Still set loaded to avoid blocking UI
      }
    };
    
    loadSettings();
  }, [setNodes]);

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
    (params) => {
      // Add the arrow marker to the new edge
      const edgeWithMarker = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(edgeWithMarker, eds));
    },
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
          providerId: defaultInitialModel.providerId,
          model: defaultInitialModel.model,
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

  // Add a flag to ignore selection change events after direct deselection
  const ignoreNextSelectionChange = useRef(false);

  // Handle clicking on the background to deselect all nodes
  const onPaneClick = useCallback((event) => {
    // Make sure this is a direct click on the pane itself
    if (event.target && event.target.classList.contains('react-flow__pane')) {
      // Set a flag to ignore the next selection change event
      ignoreNextSelectionChange.current = true;

      // Immediately deselect any selected node
      onNodeSelect(null);
      
      // Close context menu if open
      handleCloseContextMenu();
      
      // Clear any internal selection state in ReactFlow
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
    }
  }, [onNodeSelect, setNodes, handleCloseContextMenu]);

  // Handle the case when multiple nodes are selected
  const onSelectionChange = useCallback(({ nodes }) => {
    // If we just triggered a deselection via pane click, ignore this event
    if (ignoreNextSelectionChange.current) {
      ignoreNextSelectionChange.current = false;
      return;
    }
    
    if (nodes.length === 1) {
      onNodeSelect(nodes[0].id);
    } else if (nodes.length > 1) {
      // Multiple nodes selected
      onNodeSelect('multiple');
    } else if (nodes.length === 0) {
      // No nodes selected
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  // --- Context Menu Handlers ---

  const handleCloseContextMenu = () => {
    // Focus the canvas before closing menu to avoid aria-hidden issues
    const canvasElement = document.querySelector('.react-flow__pane');
    if (canvasElement) {
      canvasElement.focus();
    }
    
    // Short delay before closing to ensure focus happens first
    setTimeout(() => {
      setContextMenu(null);
    }, 0);
  };

  const handleDeleteNode = () => {
    if (!contextMenu || contextMenu.type !== 'node') return;
    const { id } = contextMenu.target;
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    handleCloseContextMenu();
  };

  const handleRemoveNodeLinks = () => {
    if (!contextMenu || contextMenu.type !== 'node') return;
    const { id } = contextMenu.target;
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    handleCloseContextMenu();
  };
  
  const handleRemoveLink = () => {
    if (!contextMenu || contextMenu.type !== 'edge') return;
    const { id } = contextMenu.target;
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
    handleCloseContextMenu();
  };

  // Copy node content to clipboard
  const handleCopyNodeText = () => {
    if (!contextMenu || contextMenu.type !== 'node') return;
    const node = nodes.find(n => n.id === contextMenu.target.id);
    if (!node) return;
    
    // Determine what text to copy based on node type
    let textToCopy = '';
    
    if (node.type === 'input') {
      // For input nodes, copy the content field
      textToCopy = node.data.content || '';
    } else if (node.type === 'model') {
      // For model nodes, copy either result text or system prompt
      textToCopy = node.data.result?.text || node.data.content || '';
    } else if (node.type === 'output') {
      // For output nodes, copy the result text
      textToCopy = node.data.result?.text || '';
    } else {
      // For other node types
      textToCopy = node.data.content || '';
    }
    
    navigator.clipboard.writeText(textToCopy);
    handleCloseContextMenu();
  };
  
  // Copy entire node configuration
  const handleCopyNode = () => {
    if (!contextMenu || contextMenu.type !== 'node') return;
    const node = nodes.find(n => n.id === contextMenu.target.id);
    if (!node) return;
    
    // Store a deep copy of the node in clipboard state (without the id)
    const nodeCopy = JSON.parse(JSON.stringify(node));
    delete nodeCopy.id; // Remove the id so a new one will be generated on paste
    
    setNodeClipboard(nodeCopy);
    handleCloseContextMenu();
  };
  
  // Paste copied node at current mouse position
  const handlePasteNode = () => {
    if (!contextMenu || contextMenu.type !== 'canvas' || !nodeClipboard || !reactFlowInstance) return;
    
    // Generate a new ID for the pasted node
    const newNodeId = uuidv4();
    
    // Get the correct flow position using screenToFlowPosition
    const position = reactFlowInstance.screenToFlowPosition({
      x: contextMenu.mouseX,
      y: contextMenu.mouseY
    });
    
    // Create a new node based on the clipboard contents
    const newNode = {
      ...nodeClipboard,
      id: newNodeId,
      position
    };
    
    // Add the new node to the graph
    setNodes(nds => [...nds, newNode]);
    
    // If it's a model node, set the provider attribute
    if (newNode.type === 'model' && newNode.data?.providerId) {
      setTimeout(() => {
        const element = document.querySelector(`[data-id="${newNodeId}"]`);
        if (element) {
          element.setAttribute('data-provider', newNode.data.providerId);
        }
      }, 50);
    }
    
    // Close menu and focus the canvas to avoid aria-hidden issues
    handleCloseContextMenu();
    
    // Focus back to the canvas after a short delay
    setTimeout(() => {
      const canvasElement = document.querySelector('.react-flow__pane');
      if (canvasElement) {
        canvasElement.focus();
      }
    }, 10);
  };
  
  // Clear all nodes and edges from the canvas
  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      setNodes([]);
      setEdges([]);
    }
    handleCloseContextMenu();
  };
  
  // Remove links connected to a specific handle
  const handleRemoveHandleLinks = () => {
    if (!contextMenu || contextMenu.type !== 'handle') return;
    const { nodeId, handleId, handleType } = contextMenu.target;
    
    setEdges(eds => eds.filter(edge => {
      if (handleType === 'source') {
        // Keep edges that don't have this node+handle as source
        return !(edge.source === nodeId && edge.sourceHandle === handleId);
      } else {
        // Keep edges that don't have this node+handle as target
        return !(edge.target === nodeId && edge.targetHandle === handleId);
      }
    }));
    
    handleCloseContextMenu();
  };

  const onNodeContextMenu = useCallback(
    (event, node) => {
      // Check if the click was on a handle
      const handleElement = event.target.closest('.react-flow__handle');
      if (handleElement) {
        // If clicked on a handle, create a handle-specific context menu
        const handleType = handleElement.classList.contains('react-flow__handle-top') ? 'target' : 'source';
        const handleId = handleElement.getAttribute('data-handleid') || 'a'; // Default to 'a' if not specified
        
        event.preventDefault();
        setContextMenu({
          mouseX: event.clientX,
          mouseY: event.clientY,
          target: {
            nodeId: node.id,
            handleId: handleId,
            handleType: handleType
          },
          type: 'handle',
        });
        return;
      }
      
      // Otherwise, regular node context menu
      event.preventDefault();
      setContextMenu({
        mouseX: event.clientX,
        mouseY: event.clientY,
        target: node,
        type: 'node',
      });
    },
    [setContextMenu]
  );

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      setContextMenu({
        mouseX: event.clientX,
        mouseY: event.clientY,
        target: edge,
        type: 'edge',
      });
    },
    [setContextMenu]
  );
  
  // Canvas context menu handler
  const onPaneContextMenu = useCallback(
    (event) => {
      // Only if not clicked on a node, edge, or handle
      if (event.target.classList.contains('react-flow__pane')) {
        event.preventDefault();
        
        // Deselect any selected node
        onNodeSelect(null);
        
        // Clear any internal selection state in ReactFlow
        setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));
        
        setContextMenu({
          mouseX: event.clientX,
          mouseY: event.clientY,
          type: 'canvas',
        });
      }
    },
    [setContextMenu, setNodes, onNodeSelect]
  );

  // --- End Context Menu Handlers ---

  return (
    <div className="dndflow" style={{ height: '100%' }}>
      <ReactFlowProvider>
        <div 
          className="reactflow-wrapper" 
          ref={reactFlowWrapper}
          data-dark-mode={isDarkMode}
          // Prevent browser context menu on the wrapper itself
          onContextMenu={(e) => e.preventDefault()} 
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
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            multiSelectionKeyCode="Control"
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background color={isDarkMode ? '#555' : '#aaa'} gap={16} />
          </ReactFlow>
        </div>
        
        {/* Context Menu Component */}
        <Menu
          open={contextMenu !== null}
          onClose={handleCloseContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
          // Add these props to help with accessibility
          MenuListProps={{
            'aria-hidden': false,
            tabIndex: -1,
            dense: true
          }}
          keepMounted={false} // This helps prevent focus issues
          disablePortal={false}
          disableAutoFocus={false}
          disableEnforceFocus={false}
        >
          {contextMenu?.type === 'node' && [
            <MenuItem key="copy-text" onClick={handleCopyNodeText}>Copy Text</MenuItem>,
            <MenuItem key="copy-node" onClick={handleCopyNode}>Copy Node</MenuItem>,
            <Divider key="node-divider" />,
            <MenuItem key="delete-node" onClick={handleDeleteNode}>Delete Node</MenuItem>,
            <MenuItem key="remove-links" onClick={handleRemoveNodeLinks}>Remove All Links</MenuItem>
          ]}
          
          {contextMenu?.type === 'edge' && (
            <MenuItem onClick={handleRemoveLink}>Remove Link</MenuItem>
          )}
          
          {contextMenu?.type === 'handle' && (
            <MenuItem onClick={handleRemoveHandleLinks}>Remove Links from this Connection</MenuItem>
          )}
          
          {contextMenu?.type === 'canvas' && [
            <MenuItem 
              key="paste-node" 
              onClick={handlePasteNode} 
              disabled={!nodeClipboard}
            >
              Paste Node
            </MenuItem>,
            <Divider key="canvas-divider" />,
            <MenuItem key="clear-canvas" onClick={handleClearCanvas}>Clear Canvas</MenuItem>
          ]}
        </Menu>
        {/* End Context Menu Component */}
        
      </ReactFlowProvider>
    </div>
  );
};

export default FlowEditor; 