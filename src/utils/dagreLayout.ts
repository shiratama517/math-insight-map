import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

const DEFAULT_OPTIONS = {
  rankdir: 'LR' as LayoutDirection,
  nodesep: 40,
  ranksep: 60,
};

/**
 * Dagre で階層レイアウトを計算し、ノードに position と接続方向を付与する。
 * 前提関係の矢印が左→右になるよう LR（Left to Right）を推奨。
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  nodeWidth: number,
  nodeHeight: number,
  direction: LayoutDirection = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: DEFAULT_OPTIONS.nodesep,
    ranksep: DEFAULT_OPTIONS.ranksep,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const isHorizontal = direction === 'LR' || direction === 'RL';

  const layoutedNodes = nodes.map((node): Node => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      },
      sourcePosition: (isHorizontal ? 'right' : 'bottom') as Node['sourcePosition'],
      targetPosition: (isHorizontal ? 'left' : 'top') as Node['targetPosition'],
    };
  });

  return { nodes: layoutedNodes, edges };
}
