import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import BaseNode from './BaseNode';

const CustomNode = ({ data }) => {
  // Custom node needs special handle configuration
  return (
    <BaseNode data={data} inputHandles={0} outputHandles={0}>
      <div className="node-header">{data.label}</div>
      <div className="node-body">
        {data.content || 'Custom node for special processing'}
      </div>
      <Handle type="target" position={Position.Top} id="a" />
      <Handle type="source" position={Position.Bottom} id="b" />
      <Handle type="source" position={Position.Right} id="c" />
    </BaseNode>
  );
};

export default memo(CustomNode); 