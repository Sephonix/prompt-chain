import React, { memo } from 'react';
import BaseNode from './BaseNode';

const InputNode = ({ data }) => {
  return (
    <BaseNode data={data} inputHandles={0}>
      <div className="node-header">{data.label}</div>
      <div className="node-body">
        {data.content || 'No prompt content provided'}
      </div>
    </BaseNode>
  );
};

export default memo(InputNode); 