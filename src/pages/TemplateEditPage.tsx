import { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import type { UnitTemplate, NodeTemplate } from '../data/types';
import { getUnitTemplate } from '../data/unitRegistry';
import { loadCustomTemplate, saveCustomTemplate } from '../lib/templateStorage';

const CATEGORIES = ['definition', 'interpretation', 'operation', 'application', 'graph', 'other'];

/** カテゴリの内部値（英語）→ 表示用（日本語） */
const CATEGORY_LABELS: Record<string, string> = {
  definition: '定義',
  interpretation: '解釈・意味',
  operation: '計算・操作',
  application: '応用',
  graph: 'グラフ',
  other: 'その他',
};

function emptyNode(id: string): NodeTemplate {
  return {
    id,
    title: '',
    description: '',
    category: 'definition',
    difficulty: 1,
    prerequisites: [],
    tags: [],
  };
}

function createDefaultUnit(): UnitTemplate {
  return {
    unit_id: `custom-${Date.now()}`,
    unit_name: '新規単元',
    grade: '',
    description: '',
    nodes: [emptyNode('N-01')],
  };
}

export function TemplateEditPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const copyFrom = searchParams.get('copy');
  const location = useLocation();
  const navigate = useNavigate();

  const isNew = !unitId || unitId === 'new';
  const importedTemplate = (location.state as { template?: UnitTemplate })?.template;

  const [unit, setUnit] = useState<UnitTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (importedTemplate) {
          if (!cancelled) setUnit({ ...importedTemplate, unit_id: importedTemplate.unit_id || `imported-${Date.now()}` });
          setLoading(false);
          return;
        }
        if (isNew && !copyFrom) {
          if (!cancelled) setUnit(createDefaultUnit());
          setLoading(false);
          return;
        }
        if (isNew && copyFrom) {
          const t = await getUnitTemplate(copyFrom);
          if (cancelled) return;
          setUnit({
            ...t,
            unit_id: `copy-${t.unit_id}-${Date.now()}`,
            unit_name: `${t.unit_name}（コピー）`,
          });
          setLoading(false);
          return;
        }
        if (unitId) {
          const custom = loadCustomTemplate(unitId);
          if (custom) {
            if (!cancelled) setUnit(custom);
          } else {
            const t = await getUnitTemplate(unitId);
            if (!cancelled) setUnit(t);
          }
        }
      } catch {
        if (!cancelled) setUnit(createDefaultUnit());
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isNew, unitId, copyFrom, importedTemplate]);

  const updateUnit = useCallback((updater: (prev: UnitTemplate) => UnitTemplate) => {
    setUnit((prev) => (prev ? updater(prev) : prev));
  }, []);

  const updateNode = useCallback(
    (index: number, patch: Partial<NodeTemplate>) => {
      updateUnit((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n, i) => (i === index ? { ...n, ...patch } : n)),
      }));
    },
    [updateUnit]
  );

  const addNode = useCallback(() => {
    if (!unit) return;
    const existingIds = unit.nodes.map((n) => n.id);
    let num = 1;
    while (existingIds.includes(`N-${String(num).padStart(2, '0')}`)) num++;
    const newId = `N-${String(num).padStart(2, '0')}`;
    updateUnit((prev) => ({
      ...prev,
      nodes: [...prev.nodes, emptyNode(newId)],
    }));
    setSelectedNodeIndex(unit.nodes.length);
  }, [unit, updateUnit]);

  const removeNode = useCallback(
    (index: number) => {
      if (!unit) return;
      const nodeId = unit.nodes[index].id;
      updateUnit((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((_, i) => i !== index).map((n) => ({
          ...n,
          prerequisites: n.prerequisites.filter((id) => id !== nodeId),
        })),
      }));
      setSelectedNodeIndex(null);
    },
    [unit, updateUnit]
  );

  const setPrerequisites = useCallback(
    (index: number, nodeIds: string[]) => {
      const node = unit?.nodes[index];
      if (!node) return;
      const selfId = node.id;
      updateUnit((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n, i) =>
          i === index ? { ...n, prerequisites: nodeIds.filter((id) => id !== selfId) } : n
        ),
      }));
    },
    [unit, updateUnit]
  );

  const handleSave = useCallback(() => {
    if (!unit) return;
    if (!unit.unit_id.trim() || !unit.unit_name.trim()) {
      alert('単元IDと単元名を入力してください。');
      return;
    }
    const ids = new Set<string>();
    for (const n of unit.nodes) {
      if (!n.id.trim()) {
        alert(`ノード${unit.nodes.indexOf(n) + 1}のIDを入力してください。`);
        return;
      }
      if (ids.has(n.id)) {
        alert(`重複するノードID: ${n.id}`);
        return;
      }
      ids.add(n.id);
    }
    for (const n of unit.nodes) {
      for (const pid of n.prerequisites) {
        if (!ids.has(pid)) {
          alert(`ノード「${n.title || n.id}」の前提に存在しないID「${pid}」が含まれています。`);
          return;
        }
      }
    }
    saveCustomTemplate(unit);
    setSaveMessage('保存しました');
    setTimeout(() => setSaveMessage(null), 2000);
    if (isNew) navigate(`/templates/edit/${unit.unit_id}`, { replace: true });
  }, [unit, isNew, navigate]);

  const handleExport = useCallback(() => {
    if (!unit) return;
    const blob = new Blob([JSON.stringify(unit, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `template-${unit.unit_id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [unit]);

  if (loading || !unit) {
    return (
      <div className="template-list-page">
        <header className="header">
          <h1>Math Insight Map</h1>
          <p className="subtitle">
            <Link to="/templates" className="back-link">← テンプレート一覧</Link>
          </p>
        </header>
        <main className="list-main">
          <p>読み込み中…</p>
        </main>
      </div>
    );
  }

  const selectedNode = selectedNodeIndex != null ? unit.nodes[selectedNodeIndex] : null;
  const nodeIds = unit.nodes.map((n) => n.id);

  return (
    <div className="template-edit-page">
      <header className="header">
        <h1>Math Insight Map</h1>
        <p className="subtitle">
          <Link to="/templates" className="back-link">← テンプレート一覧</Link>
          {unitId && unitId !== 'new' && (
            <>
              <span style={{ margin: '0 0.5rem' }}>|</span>
              <span>編集: {unit.unit_name}</span>
            </>
          )}
        </p>
      </header>
      <main className="template-edit-main">
        <section className="template-meta-section">
          <h2>単元情報</h2>
          <div className="form-row">
            <label>単元ID</label>
            <input
              value={unit.unit_id}
              onChange={(e) => updateUnit((prev) => ({ ...prev, unit_id: e.target.value.trim() }))}
              placeholder="例: quadratic_function"
              disabled={!isNew}
            />
          </div>
          <div className="form-row">
            <label>単元名</label>
            <input
              value={unit.unit_name}
              onChange={(e) => updateUnit((prev) => ({ ...prev, unit_name: e.target.value }))}
              placeholder="例: 二次関数"
            />
          </div>
          <div className="form-row">
            <label>対象学年</label>
            <input
              value={unit.grade}
              onChange={(e) => updateUnit((prev) => ({ ...prev, grade: e.target.value }))}
              placeholder="例: 高校1年"
            />
          </div>
          <div className="form-row">
            <label>説明</label>
            <textarea
              value={unit.description}
              onChange={(e) => updateUnit((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="単元の概要"
              rows={2}
            />
          </div>
        </section>

        <section className="template-nodes-section">
          <div className="nodes-header">
            <h2>ノード一覧</h2>
            <button type="button" className="btn-add" onClick={addNode}>
              ノードを追加
            </button>
          </div>
          <div className="nodes-layout">
            <ul className="nodes-list" aria-label="ノード一覧">
              {unit.nodes.map((n, i) => (
                <li
                  key={n.id}
                  className={`node-list-item ${selectedNodeIndex === i ? 'selected' : ''}`}
                >
                  <button
                    type="button"
                    className="node-list-btn"
                    onClick={() => setSelectedNodeIndex(i)}
                  >
                    <span className="node-list-id">{n.id}</span>
                    <span className="node-list-title">{n.title || '(無題)'}</span>
                    <span className="node-list-meta">難易度{n.difficulty}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`「${n.title || n.id}」を削除しますか？`)) removeNode(i);
                    }}
                    aria-label="ノードを削除"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
            <div className="node-form-panel">
              {selectedNode ? (
                <NodeForm
                  node={selectedNode}
                  allNodeIds={nodeIds}
                  onChange={(patch) => updateNode(selectedNodeIndex!, patch)}
                  onPrerequisitesChange={(ids) => setPrerequisites(selectedNodeIndex!, ids)}
                />
              ) : (
                <p className="side-panel empty">一覧からノードを選択して編集</p>
              )}
            </div>
          </div>
        </section>

        <section className="template-actions-section">
          <button type="button" className="btn-submit" onClick={handleSave}>
            保存（カスタム単元に追加・上書き）
          </button>
          <button type="button" className="btn-export-inline" onClick={handleExport}>
            JSON エクスポート
          </button>
          {saveMessage && <span className="save-message">{saveMessage}</span>}
        </section>
      </main>
    </div>
  );
}

interface NodeFormProps {
  node: NodeTemplate;
  allNodeIds: string[];
  onChange: (patch: Partial<NodeTemplate>) => void;
  onPrerequisitesChange: (nodeIds: string[]) => void;
}

function NodeForm({ node, allNodeIds, onChange, onPrerequisitesChange }: NodeFormProps) {
  const prereqSet = new Set(node.prerequisites);
  const togglePrereq = (id: string) => {
    if (id === node.id) return;
    const next = prereqSet.has(id)
      ? node.prerequisites.filter((p) => p !== id)
      : [...node.prerequisites, id];
    onPrerequisitesChange(next);
  };
  const tagsStr = Array.isArray(node.tags) ? node.tags.join(', ') : '';

  return (
    <div className="side-panel node-edit-form">
      <h3>ノード編集</h3>
      <div className="form-row">
        <label>ID</label>
        <input
          value={node.id}
          onChange={(e) => onChange({ id: e.target.value.trim() })}
          placeholder="例: QF-01"
        />
      </div>
      <div className="form-row">
        <label>タイトル</label>
        <input
          value={node.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="ノード名"
        />
      </div>
      <div className="form-row">
        <label>説明</label>
        <textarea
          value={node.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="説明文"
          rows={2}
        />
      </div>
      <div className="form-row">
        <label>カテゴリ</label>
        <select
          value={node.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>難易度 (1–5)</label>
        <input
          type="number"
          min={1}
          max={5}
          value={node.difficulty}
          onChange={(e) => onChange({ difficulty: Number(e.target.value) || 1 })}
        />
      </div>
      <div className="form-row">
        <label>前提ノード（このノードの前に理解しておくもの）</label>
        <div className="prereq-chips">
          {allNodeIds
            .filter((id) => id !== node.id)
            .map((id) => (
              <label key={id} className="chip">
                <input
                  type="checkbox"
                  checked={prereqSet.has(id)}
                  onChange={() => togglePrereq(id)}
                />
                <span>{id}</span>
              </label>
            ))}
          {allNodeIds.length <= 1 && <span className="muted">他ノードを追加すると選択できます</span>}
        </div>
      </div>
      <div className="form-row">
        <label>タグ（カンマ区切り）</label>
        <input
          value={tagsStr}
          onChange={(e) =>
            onChange({
              tags: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="例: graph, definition"
        />
      </div>
    </div>
  );
}
