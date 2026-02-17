import { useCallback, useEffect, useState } from 'react';
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
  /** クリックで選択中のノードID。詳細表示中はこのノードに接続する辺の強調を維持する。 */
  selectedNodeId?: string | null;
}

export function GraphView({
  flowNodes,
  flowEdges,
  onNodeSelect,
  selectedNodeId = null,
}: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  /** ホバー優先、未ホバー時は選択中ノードで辺を強調する。 */
  const effectiveHighlightId = highlightedNodeId ?? selectedNodeId ?? null;

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  /**
   * ホバー中または選択中のノードに接続している辺を強調する。
   * 接続辺は太く・アニメーション、他は薄くする。
   */
  useEffect(() => {
    if (!effectiveHighlightId) {
      setEdges((prev) =>
        prev.map((e) => ({ ...e, style: undefined, animated: false }))
      );
      return;
    }
    const hid = String(effectiveHighlightId);
    setEdges((prev) =>
      prev.map((e) => {
        const connected =
          String(e.source) === hid || String(e.target) === hid;
        return {
          ...e,
          style: connected
            ? { stroke: '#0d6efd', strokeWidth: 3 }
            : { opacity: 0.2 },
          animated: connected,
        };
      })
    );
  }, [effectiveHighlightId, setEdges]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHighlightedNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHighlightedNodeId(null);
  }, []);

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
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
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
