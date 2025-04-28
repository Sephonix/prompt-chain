import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Snackbar, 
  Alert, 
  Tooltip,
  CssBaseline,
  useMediaQuery,
  createTheme,
  ThemeProvider
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FlowEditor from './FlowEditor';
import Sidebar from './Sidebar';
import SettingsDialog from './SettingsDialog';
import { hasConfiguredProvider } from '../utils/settingsService';

const App = () => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [flowNodes, setFlowNodes] = useState([]); // Store nodes for passing between components
  
  // Dark mode state
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDarkMode ? 'dark' : 'light');
  
  // Create theme based on dark/light mode
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );
  
  // Toggle dark/light mode
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Use a ref to track completed nodes and avoid state updates during execution
  const completedNodesRef = useRef(new Set());
  const executionCompletedRef = useRef(false);

  // Check if API providers are configured on initial load
  useEffect(() => {
    if (!hasConfiguredProvider()) {
      setNotification({ 
        open: true, 
        message: 'Please configure at least one API provider in settings to use AI models', 
        severity: 'warning' 
      });
    }
  }, []);

  // Reset tracking when starting a new run
  useEffect(() => {
    if (running) {
      completedNodesRef.current = new Set();
      executionCompletedRef.current = false;
    }
  }, [running]);

  const handleRun = () => {
    if (running) return;
    
    // Check if any API provider is configured
    if (!hasConfiguredProvider()) {
      setNotification({ 
        open: true, 
        message: 'Please configure at least one API provider in settings before running', 
        severity: 'error' 
      });
      return;
    }
    
    setRunning(true);
    setNotification({ 
      open: true, 
      message: 'Executing flow...', 
      severity: 'info' 
    });
    
    // The actual execution happens in FlowEditor component
  };

  const handleStop = () => {
    setRunning(false);
    executionCompletedRef.current = true;
    setNotification({ 
      open: true, 
      message: 'Execution stopped', 
      severity: 'warning' 
    });
  };

  const handleNodeSelect = (nodeId) => {
    setSelectedNodeId(nodeId);
  };

  const handleUpdateResults = (nodeId, result) => {
    // Skip if we've already processed this node in the current run
    if (completedNodesRef.current.has(nodeId)) {
      return;
    }
    
    // Mark this node as processed for this run
    completedNodesRef.current.add(nodeId);
    
    // Update results safely
    setResults(prev => ({
      ...prev,
      [nodeId]: result
    }));

    // If execution is already marked as completed, don't update running state again
    if (executionCompletedRef.current) {
      return;
    }

    // If this is the last node in a flow (output node), notify completion
    if (result && result.nodeType === 'output') {
      executionCompletedRef.current = true;
      setRunning(false);
      setNotification({ 
        open: true, 
        message: 'Flow execution completed', 
        severity: 'success' 
      });
    }

    // Handle errors
    if (result && result.error) {
      executionCompletedRef.current = true;
      setError(`Error in node ${nodeId}: ${result.text}`);
      setRunning(false);
      setNotification({ 
        open: true, 
        message: `Error in node ${nodeId}`, 
        severity: 'error' 
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  // Handle node updates and pass to both editor and sidebar
  const handleUpdateNodeData = (nodeId, newData) => {
    // Update flowNodes for sidebar
    setFlowNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } } 
          : node
      )
    );
    
    // Make sure the onUpdateNodeData callback is also called for FlowEditor
    if (onUpdateNodeDataRef.current) {
      onUpdateNodeDataRef.current(nodeId, newData);
    }
  };
  
  // Reference to the FlowEditor's update function
  const onUpdateNodeDataRef = useRef(null);
  
  // Callback for FlowEditor to register its update function
  const handleRegisterUpdateNodeData = (updateFn) => {
    onUpdateNodeDataRef.current = updateFn;
  };

  // Handle nodes changing in the editor
  const handleNodesChange = (nodes) => {
    setFlowNodes(nodes);
    
    // If a node was just added, select it automatically
    const addedNode = nodes.find(node => !flowNodes.some(n => n.id === node.id));
    if (addedNode) {
      setSelectedNodeId(addedNode.id);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Prompt Chain
            </Typography>
            
            <Tooltip title="Toggle Dark Mode">
              <IconButton 
                color="inherit" 
                onClick={toggleColorMode}
                sx={{ mr: 1 }}
              >
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="API Provider Settings">
              <IconButton 
                color="inherit" 
                onClick={handleOpenSettings}
                sx={{ mr: 2 }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            {running ? (
              <Button 
                color="error" 
                variant="contained"
                onClick={handleStop}
              >
                Stop
              </Button>
            ) : (
              <Button 
                color="success" 
                variant="contained"
                onClick={handleRun}
              >
                Run Flow
              </Button>
            )}
          </Toolbar>
        </AppBar>
        
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <Sidebar 
            selectedNodeId={selectedNodeId}
            onUpdateNodeData={handleUpdateNodeData}
            nodes={flowNodes}
          />
          <Box 
            sx={{ flexGrow: 1, height: '100%' }}
            data-dark-mode={theme.palette.mode === 'dark'}
          >
            <FlowEditor 
              onNodeSelect={handleNodeSelect} 
              running={running}
              results={results}
              onUpdateResults={handleUpdateResults}
              onUpdateNodeData={handleUpdateNodeData}
              onFlowNodesChange={handleNodesChange}
              onRegisterUpdateNodeData={handleRegisterUpdateNodeData}
            />
          </Box>
        </Box>

        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity}>
            {notification.message}
          </Alert>
        </Snackbar>
        
        <SettingsDialog open={settingsOpen} onClose={handleCloseSettings} />
      </Box>
    </ThemeProvider>
  );
};

export default App; 