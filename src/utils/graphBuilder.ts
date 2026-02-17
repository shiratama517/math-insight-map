import type { Node, Edge } from '@xyflow/react';
import type { NodeTemplate } from '../data/types';
import { levelToColor } from './colorMapper';

export interface GraphBuilderInput {
  nodes: NodeTemplate[];
  getLevel: (nodeId: string) => number;
  /** ボトルネックとしてハイライトするノード ID 一覧（省略可） */
  bottleneckNodeIds?: string[];
}

/** テンプレートと理解度から React Flow の nodes / edges を生成する */
export function buildFlowGraph({
  nodes,
  getLevel,
  bottleneckNodeIds = [],
}: GraphBuilderInput): { flowNodes: Node[]; flowEdges: Edge[] } {
  const bottleneckSet = new Set(bottleneckNodeIds);
  const flowNodes: Node[] = nodes.map((n, i) => {
    const level = getLevel(n.id);
    const color = levelToColor(level as 0 | 1 | 2 | 3 | 4);
    const isBottleneck = bottleneckSet.has(n.id);
    return {
      id: n.id,
      type: 'default',
      position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 120 },
      data: {
        label: n.title,
        level,
        color,
        bottleneck: isBottleneck,
        ...n,
      },
      style: {
        ...(isBottleneck
          ? {
              backgroundImage: `linear-gradient(${color}, ${color}), repeating-linear-gradient(45deg, #ffeb3b 0, #ffeb3b 8px, #000 8px, #000 12px)`,
              backgroundOrigin: 'padding-box, border-box',
              backgroundClip: 'padding-box, border-box',
            }
          : { background: color }),
        color: level <= 2 ? '#1a1a1a' : '#fff',
        border: isBottleneck ? '3px solid transparent' : '1px solid #333',
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
