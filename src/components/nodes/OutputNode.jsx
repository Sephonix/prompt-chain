import React, { memo, useState } from 'react';
import BaseNode from './BaseNode';
import ViewGenerationDialog from '../ViewGenerationDialog';
import { Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

const OutputNode = ({ data }) => {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
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
      <BaseNode data={data} outputHandles={0}>
        <div className="node-header">{data.label}</div>
        <div className="node-body">
          {data.result 
            ? data.result.text 
            : 'No output generated yet'
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
                View Output
              </Button>
              <span className="timestamp">Generated at: {new Date(data.result.timestamp).toLocaleTimeString()}</span>
            </>
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

export default memo(OutputNode); 