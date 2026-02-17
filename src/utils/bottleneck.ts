import type { NodeTemplate } from '../data/types';

/**
 * ボトルネック検出: 理解度 ≤1 かつ、そのノードを前提に持つノードが 2 つ以上あるノードの ID 一覧を返す
 */
export function getBottleneckNodeIds(
  nodes: NodeTemplate[],
  getLevel: (nodeId: string) => number
): string[] {
  const prerequisiteCount: Record<string, number> = {};
  for (const n of nodes) {
    for (const predId of n.prerequisites) {
      prerequisiteCount[predId] = (prerequisiteCount[predId] ?? 0) + 1;
    }
  }
  const result: string[] = [];
  for (const n of nodes) {
    const level = getLevel(n.id);
    const count = prerequisiteCount[n.id] ?? 0;
    if (level <= 1 && count >= 2) {
      result.push(n.id);
    }
  }
  return result;
}
