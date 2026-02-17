import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NodeTemplate } from '../data/types';

interface GraphViewProps {
  flowNodes: Node[];
  flowEdges: Edge[];
  onNodeSelect: (node: NodeTemplate | null) => void;
}

export function GraphView({
  flowNodes,
  flowEdges,
  onNodeSelect,
}: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const onNodesChangeHandler: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );
  const onEdgesChangeHandler: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as NodeTemplate & { label?: string; level?: number; color?: string };
      onNodeSelect({
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        prerequisites: data.prerequisites,
        tags: data.tags,
      });
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400 }}>
      <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
