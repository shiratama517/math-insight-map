import type { NodeTemplate } from '../data/types';

/** 理解度が低い前提ノードを「この順で確認するとよい」リストとして返す（理解度 ≤2 のもののみ、prerequisites の順） */
export function getRecommendedPrerequisites(
  node: NodeTemplate,
  nodes: NodeTemplate[],
  getLevel: (nodeId: string) => number
): Array<{ id: string; title: string; level: number }> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const result: Array<{ id: string; title: string; level: number }> = [];
  for (const prereqId of node.prerequisites) {
    const level = getLevel(prereqId);
    if (level <= 2) {
      const prereq = byId.get(prereqId);
      if (prereq) {
        result.push({ id: prereq.id, title: prereq.title, level });
      }
    }
  }
  return result;
}
