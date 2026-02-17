import type { NodeTemplate } from '../data/types';
import type { UnderstandingLevel } from '../data/types';

const LEVEL_LABELS: Record<UnderstandingLevel, string> = {
  0: '未学習',
  1: '見たことがある',
  2: '誘導ありでできる',
  3: '一人で解ける',
  4: '説明できる',
};

/** 指導提案で表示する前提ノード（この順で確認するとよい） */
export interface RecommendedPrereq {
  id: string;
  title: string;
  level: number;
}

interface NodeDetailPanelProps {
  node: NodeTemplate | null;
  level: UnderstandingLevel;
  memo: string;
  lastChecked: string | undefined;
  /** 選択ノードの前提のうち理解度が低いもの（指導提案） */
  recommendedPrerequisites?: RecommendedPrereq[];
  onLevelChange: (level: UnderstandingLevel) => void;
  onMemoChange: (memo: string) => void;
}

export function NodeDetailPanel({
  node,
  level,
  memo,
  lastChecked,
  recommendedPrerequisites = [],
  onLevelChange,
  onMemoChange,
}: NodeDetailPanelProps) {
  if (!node) {
    return (
      <div className="side-panel empty">
        <p>ノードをクリックすると詳細を表示・編集できます</p>
      </div>
    );
  }

  return (
    <div className="side-panel">
      <h3>{node.title}</h3>
      <p className="description">{node.description}</p>
      <div className="field">
        <label>理解度</label>
        <select
          value={level}
          onChange={(e) =>
            onLevelChange(Number(e.target.value) as UnderstandingLevel)
          }
        >
          {( [0, 1, 2, 3, 4] as const ).map((l) => (
            <option key={l} value={l}>
              {l}: {LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
      </div>
      {lastChecked && (
        <div className="field">
          <label>最終確認日</label>
          <span>{lastChecked}</span>
        </div>
      )}
      {recommendedPrerequisites.length > 0 && (
        <div className="field guidance">
          <label>指導提案（この順で確認するとよい）</label>
          <ol className="guidance-list">
            {recommendedPrerequisites.map((pr) => (
              <li key={pr.id}>
                {pr.title} <span className="guidance-level">（理解度: {pr.level}）</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="field">
        <label>メモ</label>
        <textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          rows={4}
          placeholder="指導メモを入力"
        />
      </div>
    </div>
  );
}
