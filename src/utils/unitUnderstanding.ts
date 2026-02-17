import type { UnderstandingLevel } from '../data/types';

export interface UnitUnderstandingResult {
  /** 単元内ノードの理解度の平均（0〜4）。未登録は0扱い */
  average: number;
  /** 達成率（level >= 2 のノードの割合、0〜1） */
  achievementRate: number;
  /** ノード数 */
  nodeCount: number;
  /** level >= 2 のノード数 */
  achievedCount: number;
}

/**
 * 単元の理解度（平均）と達成率（level≥2 の割合）を算出する。
 * @param nodeIds 単元に属するノードID一覧
 * @param getLevel ノードIDから理解度(0〜4)を返す関数。未登録は0として扱う
 */
export function computeUnitUnderstanding(
  nodeIds: string[],
  getLevel: (nodeId: string) => UnderstandingLevel | number
): UnitUnderstandingResult {
  if (nodeIds.length === 0) {
    return { average: 0, achievementRate: 0, nodeCount: 0, achievedCount: 0 };
  }
  let sum = 0;
  let achievedCount = 0;
  for (const id of nodeIds) {
    const level = Number(getLevel(id)) || 0;
    sum += level;
    if (level >= 2) achievedCount += 1;
  }
  const average = sum / nodeIds.length;
  const achievementRate = nodeIds.length > 0 ? achievedCount / nodeIds.length : 0;
  return {
    average,
    achievementRate,
    nodeCount: nodeIds.length,
    achievedCount,
  };
}
