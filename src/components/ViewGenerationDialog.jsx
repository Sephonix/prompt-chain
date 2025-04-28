import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/**
 * Dialog to display text output from nodes
 */
const ViewGenerationDialog = ({ open, onClose, nodeData }) => {
  const generatedText = nodeData?.result?.text || '';
  const nodeType = nodeData?.nodeType || 'unknown';
  const isOutputNode = nodeType === 'output';
  const isModelNode = nodeType === 'model';
  
  // Get appropriate title and model info based on node type
  const dialogTitle = isOutputNode ? 'Output Text' : 'Generated Text';
  const modelName = nodeData?.model || 'Model';
  const timestamp = nodeData?.result?.timestamp 
    ? new Date(nodeData.result.timestamp).toLocaleString() 
    : '';
  
  const handleCopyText = () => {
    if (generatedText) {
      navigator.clipboard.writeText(generatedText);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {nodeData?.label ? `${nodeData.label} - ${dialogTitle}` : dialogTitle}
          </Typography>
          <Box>
            <IconButton 
              aria-label="copy text"
              onClick={handleCopyText}
              title="Copy to clipboard"
              size="small"
              sx={{ mr: 1 }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <IconButton 
              aria-label="close" 
              onClick={onClose}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {isModelNode ? `${modelName} • ` : ''}{timestamp}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box 
          sx={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            p: 1,
            backgroundColor: (theme) => 
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: 1,
            maxHeight: '60vh',
            overflow: 'auto'
          }}
        >
          {generatedText || 'No content generated yet.'}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewGenerationDialog; 