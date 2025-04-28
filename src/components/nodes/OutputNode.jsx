import React, { memo } from 'react';
import BaseNode from './BaseNode';

const OutputNode = ({ data }) => {
  return (
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
          <span>Generated at: {new Date(data.result.timestamp).toLocaleTimeString()}</span>
        )}
      </div>
    </BaseNode>
  );
};

export default memo(OutputNode); 