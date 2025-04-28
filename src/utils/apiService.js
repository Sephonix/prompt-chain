/**
 * API Service for making calls to LLM providers
 */

import { getSettings } from './settingsService';

// Safely access electron's ipcRenderer
const ipcRenderer = window.electron?.ipcRenderer;

/**
 * Call a model API with the provided parameters
 * @param {string} model - The model to use
 * @param {string} prompt - The text prompt to send
 * @param {Object} params - Additional parameters (temperature, max_tokens, etc.)
 * @returns {Promise<Object>} The API response
 */
export const callModelAPI = async (model, prompt, params = {}) => {
  try {
    // Check if ipcRenderer is available
    if (!ipcRenderer) {
      console.warn('Electron IPC renderer not available, using mock response');
      // Return a mock response when running in dev mode or without proper Electron setup
      return {
        success: true,
        text: `[MOCK] Generated response for model ${model} with prompt: ${prompt.substring(0, 30)}...`,
        model,
        timestamp: new Date().toISOString()
      };
    }

    // Get settings to check if the provider is enabled and configured
    const settings = await getSettings();
    
    // Call the main process to make the API request
    // This is a secure way to handle API keys in Electron
    console.log('[apiService] Invoking call-api with:', { model, promptLength: prompt.length, params });
    const response = await ipcRenderer.invoke('call-api', {
      endpoint: 'generate',
      model,
      prompt,
      params
    });
    
    console.log('[apiService] Received response from main process:', response);

    // Map response.result to response.text if necessary (backward compatibility)
    if (response && response.success && typeof response.result === 'string' && typeof response.text === 'undefined') {
      response.text = response.result;
    }

    return response;
  } catch (error) {
    console.error('Error calling model API:', error);
    return {
      success: false,
      text: `Error: ${error.message}`,
      error: true,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Create a DAG (Directed Acyclic Graph) execution order
 * @param {Array} nodes - Array of nodes
 * @param {Array} edges - Array of edges
 * @returns {Array} Ordered array of node IDs for execution
 */
export const createExecutionOrder = (nodes, edges) => {
  // Create a map of node dependencies
  const dependencies = {};
  const nodeMap = {};
  
  // Initialize dependencies
  nodes.forEach(node => {
    dependencies[node.id] = [];
    nodeMap[node.id] = node;
  });
  
  // Fill dependencies based on edges
  edges.forEach(edge => {
    if (dependencies[edge.target]) {
      dependencies[edge.target].push(edge.source);
    }
  });
  
  // Topological sort
  const visited = {};
  const temp = {};
  const order = [];
  
  // Check for cycles and build execution order
  const visit = (nodeId) => {
    if (temp[nodeId]) {
      throw new Error('Graph has a cycle, cannot determine execution order');
    }
    
    if (!visited[nodeId]) {
      temp[nodeId] = true;
      
      // Visit dependencies first
      dependencies[nodeId].forEach(depId => {
        visit(depId);
      });
      
      temp[nodeId] = false;
      visited[nodeId] = true;
      order.push(nodeId);
    }
  };
  
  // Visit all nodes
  nodes.forEach(node => {
    if (!visited[node.id]) {
      visit(node.id);
    }
  });
  
  return order;
};

/**
 * Process a single node in the execution flow
 * @param {Object} node - The node to process
 * @param {Object} nodeResults - Results from previous nodes
 * @param {Object} inputEdges - Edges with this node as target
 * @param {Array} allNodes - All nodes in the graph
 * @returns {Promise<Object>} The result of processing the node
 */
export const processNode = async (node, nodeResults, inputEdges, allNodes) => {
  // Get input data from connected nodes
  const inputData = {};
  
  inputEdges.forEach(edge => {
    const sourceId = edge.source;
    if (nodeResults[sourceId]) {
      inputData[sourceId] = nodeResults[sourceId];
    }
  });
  
  // Different processing based on node type
  switch (node.type) {
    case 'input':
      // Input nodes just provide their content
      return {
        text: node.data.content || '',
        nodeType: 'input',
        timestamp: new Date().toISOString()
      };
      
    case 'model':
      // Model nodes call the API with inputs
      let combinedPrompt = '';
      
      // Combine inputs if any
      if (Object.keys(inputData).length > 0) {
        combinedPrompt = Object.values(inputData)
          .map(input => input.text)
          .join('\n\n');
      }
      
      // Add the node's own content as a system prompt if it exists
      if (node.data.content) {
        combinedPrompt = `${node.data.content}\n\n${combinedPrompt}`;
      }
      
      // Call the model API
      try {
        console.log(`[apiService] Processing model node ${node.id} with data:`, node.data);
        const apiResult = await callModelAPI(
          node.data.model || 'gpt-4.1-nano-2025-04-14',
          combinedPrompt,
          {
            temperature: node.data.temperature || 0.7,
            max_tokens: node.data.maxTokens || 500
          }
        );
        
        // Trim whitespace from the result text
        if (apiResult && apiResult.text) {
          apiResult.text = apiResult.text.trim();
        } else {
          console.warn(`[apiService] API result for node ${node.id} is missing text:`, apiResult);
        }
        
        console.log(`[apiService] Returning result for model node ${node.id}:`, apiResult);
        return apiResult;
      } catch (error) {
        return {
          text: `Error: ${error.message}`,
          error: true,
          timestamp: new Date().toISOString()
        };
      }
      
    case 'output':
      // Output nodes just pass through their input
      const firstInput = Object.values(inputData)[0];
      // Ensure we construct a consistent result object
      const outputText = (firstInput?.text || '').trim();
      const outputTimestamp = firstInput?.timestamp || new Date().toISOString();
      
      return {
        text: outputText || 'No input received', // Show message if text is empty after trim
        timestamp: outputTimestamp,
        nodeType: 'output' // Add nodeType for clarity
      };
      
    case 'custom':
      // Custom nodes can implement special logic
      return {
        text: `Custom processing: ${node.data.content || 'No custom logic defined'}`,
        timestamp: new Date().toISOString()
      };
      
    default:
      return {
        text: `Unknown node type: ${node.type}`,
        error: true,
        timestamp: new Date().toISOString()
      };
  }
}; 