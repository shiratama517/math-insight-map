import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
import type { UnitMeta } from '../data/unitRegistry';
import {
  getAvailableUnitsGroupedBySubject,
  getUnitTemplate,
  getUnitPrerequisites,
} from '../data/unitRegistry';
import { loadStudent } from '../lib/storage';
import { computeUnitUnderstanding } from '../utils/unitUnderstanding';
import { levelToColor } from '../utils/colorMapper';
import { getLayoutedElements } from '../utils/dagreLayout';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;

function buildUnitFlowGraph(
  grouped: { subject_name: string; units: UnitMeta[] }[],
  getUnderstanding: (unitId: string) => { average: number; achievementRate: number } | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];

  for (const group of grouped) {
    for (const u of group.units) {
      const understanding = getUnderstanding(u.unit_id);
      const average = understanding?.average ?? 0;
      const achievementRate = understanding?.achievementRate ?? 0;
      const color = levelToColor(Math.round(average) as 0 | 1 | 2 | 3 | 4);
      const achievementPercent = Math.round(achievementRate * 100);
      nodes.push({
        id: u.unit_id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {
          label: `${u.unit_name}（達成率 ${achievementPercent}%）`,
        },
        style: {
          background: color,
          color: average <= 2 ? '#1a1a1a' : '#fff',
          border: '1px solid #333',
          borderRadius: 8,
          padding: 8,
          width: NODE_WIDTH,
          fontSize: 12,
        },
      });
    }
  }

  const edges: Edge[] = [];
  for (const group of grouped) {
    for (const u of group.units) {
      for (const predId of getUnitPrerequisites(u.unit_id)) {
        edges.push({
          id: `${predId}-${u.unit_id}`,
          source: predId,
          target: u.unit_id,
        });
      }
    }
  }

  return { nodes, edges };
}

export function UnitUnderstandingMapPage() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('student') ?? '';
  const [unitUnderstandingMap, setUnitUnderstandingMap] = useState<
    Record<string, { average: number; achievementRate: number }>
  >({});
  const [loading, setLoading] = useState(true);

  const student = useMemo(() => (studentId ? loadStudent(studentId) : null), [studentId]);
  const grouped = useMemo(() => getAvailableUnitsGroupedBySubject(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!studentId || !student) {
        setLoading(false);
        return;
      }
      const groups = getAvailableUnitsGroupedBySubject();
      const unitIds = groups.flatMap((g) => g.units.map((u) => u.unit_id));
      const statusByUnit = student.nodeStatusByUnit ?? {};

      const map: Record<string, { average: number; achievementRate: number }> = {};
      await Promise.all(
        unitIds.map(async (unitId) => {
          if (cancelled) return;
          try {
            const template = await getUnitTemplate(unitId);
            const nodeIds = template.nodes.map((n) => n.id);
            const getLevel = (nodeId: string) =>
              statusByUnit[unitId]?.[nodeId]?.understanding_level ?? 0;
            const result = computeUnitUnderstanding(nodeIds, getLevel);
            if (!cancelled) {
              map[unitId] = {
                average: result.average,
                achievementRate: result.achievementRate,
              };
            }
          } catch {
            if (!cancelled) map[unitId] = { average: 0, achievementRate: 0 };
          }
        })
      );
      if (!cancelled) setUnitUnderstandingMap(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, student]);

  const getUnderstanding = useCallback(
    (unitId: string) => unitUnderstandingMap[unitId] ?? null,
    [unitUnderstandingMap]
  );

  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    const { nodes: rawNodes, edges: rawEdges } = buildUnitFlowGraph(grouped, getUnderstanding);
    return getLayoutedElements(rawNodes, rawEdges, NODE_WIDTH, NODE_HEIGHT, 'LR');
  }, [grouped, getUnderstanding]);

  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  /**
   * ホバー中のノードに接続している辺を強調する。
   * 強調条件: 辺の source または target が、ホバー中のノード id と一致するとき。
   * 一致しない辺（他ノード同士を結ぶ辺）は薄くする。
   * ※ source/target は文字列に正規化して比較（型違いで一致しないことを防ぐ）。
   */
  useEffect(() => {
    if (!highlightedNodeId) {
      setEdges((prev) =>
        prev.map((e) => ({ ...e, style: undefined, animated: false }))
      );
      return;
    }
    const hid = String(highlightedNodeId);
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
  }, [highlightedNodeId, setEdges]);

  const onNodesChangeHandler: OnNodesChange = useCallback((changes) => onNodesChange(changes), [onNodesChange]);
  const onEdgesChangeHandler: OnEdgesChange = useCallback((changes) => onEdgesChange(changes), [onEdgesChange]);

  const navigate = useNavigate();
  const goToUnit = useCallback(
    (unitId: string) => {
      if (studentId) navigate(`/student/${studentId}?unit=${unitId}`);
    },
    [studentId, navigate]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      goToUnit(node.id);
    },
    [goToUnit]
  );

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHighlightedNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHighlightedNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {}, []);

  if (!studentId) {
    return (
      <div className="unit-map-page">
        <header className="header">
          <h1>Math Insight Map</h1>
          <p className="subtitle">
            <Link to="/" className="back-link">← 生徒一覧</Link>
            <span style={{ margin: '0 0.5rem' }}>|</span>
            <Link to="/unit-map" className="back-link">単元マップ</Link>
            <span style={{ margin: '0 0.5rem' }}>|</span>
            <span>単元ごとの理解度マップ</span>
          </p>
        </header>
        <main className="list-main" style={{ maxWidth: '40rem' }}>
          <p className="section-desc">生徒を選択してから単元マップで「単元ごとの理解度マップ」を開いてください。</p>
          <p>
            <Link to="/unit-map" className="btn-link">単元マップへ</Link>
          </p>
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="unit-map-page">
        <header className="header">
          <h1>Math Insight Map</h1>
          <p className="subtitle">
            <Link to="/unit-map" className="back-link">← 単元マップ</Link>
            <span style={{ margin: '0 0.5rem' }}>|</span>
            <span>単元ごとの理解度マップ</span>
          </p>
        </header>
        <main className="list-main" style={{ maxWidth: '40rem' }}>
          <p className="section-desc" style={{ color: 'var(--muted)' }}>選択された生徒が見つかりません。</p>
          <p>
            <Link to={`/unit-map?student=${studentId}`} className="btn-link">単元マップへ</Link>
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="unit-map-page unit-understanding-map-page">
      <header className="header">
        <h1>Math Insight Map</h1>
        <p className="subtitle">
          <Link to="/" className="back-link">← 生徒一覧</Link>
          <span style={{ margin: '0 0.5rem' }}>|</span>
          <Link to={`/unit-map?student=${studentId}`} className="back-link">単元マップ</Link>
          <span style={{ margin: '0 0.5rem' }}>|</span>
          <span>単元ごとの理解度マップ（{student.name}）</span>
        </p>
      </header>
      <main className="unit-understanding-main" style={{ height: 'calc(100vh - 120px)', minHeight: 400 }}>
        {loading ? (
          <p className="section-desc">読み込み中…</p>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
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
        )}
      </main>
    </div>
  );
}
