import type { Node, Edge } from '@xyflow/react';
import type { NodeTemplate } from '../data/types';
import { levelToColor } from './colorMapper';

export interface GraphBuilderInput {
  nodes: NodeTemplate[];
  getLevel: (nodeId: string) => number;
}

/** テンプレートと理解度から React Flow の nodes / edges を生成する */
export function buildFlowGraph({
  nodes,
  getLevel,
}: GraphBuilderInput): { flowNodes: Node[]; flowEdges: Edge[] } {
  const flowNodes: Node[] = nodes.map((n, i) => {
    const level = getLevel(n.id);
    const color = levelToColor(level as 0 | 1 | 2 | 3 | 4);
    return {
      id: n.id,
      type: 'default',
      position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 120 },
      data: {
        label: n.title,
        level,
        color,
        ...n,
      },
      style: {
        background: color,
        color: level <= 2 ? '#1a1a1a' : '#fff',
        border: '1px solid #333',
        borderRadius: 8,
        padding: 8,
      },
    };
  });

  const flowEdges: Edge[] = [];
  for (const n of nodes) {
    for (const predId of n.prerequisites) {
      flowEdges.push({
        id: `${predId}-${n.id}`,
        source: predId,
        target: n.id,
      });
    }
  }

  return { flowNodes, flowEdges };
}
