import { useMemo, useState, useCallback, useEffect } from 'react';
import type { UnitTemplate, NodeTemplate, UnderstandingLevel } from '../data/types';
import { AVAILABLE_UNITS, getUnitTemplate } from '../data/unitRegistry';
import { buildFlowGraph } from '../utils/graphBuilder';
import {
  loadStudent,
  saveStudent,
  createInitialStudent,
  ensureUnitStatus,
} from '../lib/storage';
import { GraphView } from '../components/GraphView';
import { NodeDetailPanel } from '../components/NodeDetailPanel';

const STUDENT_ID = 'student-demo';

function getLevel(
  nodeStatus: Record<string, { understanding_level: UnderstandingLevel }>,
  nodeId: string
): UnderstandingLevel {
  return nodeStatus[nodeId]?.understanding_level ?? 0;
}

function getUnitIdFromSearch(): string {
  const params = new URLSearchParams(window.location.search);
  const u = params.get('unit');
  if (u && AVAILABLE_UNITS.some((meta) => meta.unit_id === u)) return u;
  return 'quadratic_function';
}

export function StudentDetailPage() {
  const [unitId, setUnitId] = useState(getUnitIdFromSearch);
  const [unit, setUnit] = useState<UnitTemplate | null>(null);
  const [student, setStudent] = useState<ReturnType<typeof loadStudent>>(() =>
    loadStudent(STUDENT_ID)
  );
  const [selectedNode, setSelectedNode] = useState<NodeTemplate | null>(null);

  useEffect(() => {
    getUnitTemplate(unitId).then((template) => {
      setUnit(template);
    });
  }, [unitId]);

  useEffect(() => {
    if (!unit) return;
    const nodeIds = unit.nodes.map((n) => n.id);
    if (!student) {
      setStudent(
        createInitialStudent(STUDENT_ID, 'デモ生徒', unitId, nodeIds)
      );
      return;
    }
    const next = ensureUnitStatus(student, unitId, nodeIds);
    if (next !== student) setStudent(next);
  }, [unit, unitId]); // eslint-disable-line react-hooks/exhaustive-deps -- student の初期化は unit 到着時のみ

  const unitStatus = student?.nodeStatusByUnit[unitId];
  const getLevelForNode = useCallback(
    (nodeId: string) =>
      getLevel(unitStatus ?? {}, nodeId),
    [unitStatus]
  );

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!unit) return { flowNodes: [], flowEdges: [] };
    return buildFlowGraph({
      nodes: unit.nodes,
      getLevel: getLevelForNode,
    });
  }, [unit, getLevelForNode]);

  const selectedStatus = selectedNode && unitStatus?.[selectedNode.id];
  const selectedLevel = selectedNode ? getLevelForNode(selectedNode.id) : 0;
  const selectedMemo = selectedStatus?.memo ?? '';
  const selectedLastChecked = selectedStatus?.last_checked;

  const handleLevelChange = useCallback(
    (nodeId: string, level: UnderstandingLevel) => {
      if (!student) return;
      setStudent((prev) => {
        if (!prev) return prev;
        const byUnit = prev.nodeStatusByUnit[unitId] ?? {};
        const next = {
          ...prev,
          nodeStatusByUnit: {
            ...prev.nodeStatusByUnit,
            [unitId]: {
              ...byUnit,
              [nodeId]: {
                ...byUnit[nodeId],
                node_id: nodeId,
                understanding_level: level,
                last_checked: new Date().toISOString().slice(0, 10),
                memo: byUnit[nodeId]?.memo ?? '',
              },
            },
          },
        };
        saveStudent(next);
        return next;
      });
    },
    [unitId, student]
  );

  const handleMemoChange = useCallback(
    (nodeId: string, memo: string) => {
      if (!student) return;
      setStudent((prev) => {
        if (!prev) return prev;
        const byUnit = prev.nodeStatusByUnit[unitId] ?? {};
        const next = {
          ...prev,
          nodeStatusByUnit: {
            ...prev.nodeStatusByUnit,
            [unitId]: {
              ...byUnit,
              [nodeId]: {
                ...byUnit[nodeId],
                node_id: nodeId,
                understanding_level: byUnit[nodeId]?.understanding_level ?? 0,
                last_checked: byUnit[nodeId]?.last_checked,
                memo,
              },
            },
          },
        };
        saveStudent(next);
        return next;
      });
    },
    [unitId, student]
  );

  const handleUnitChange = useCallback((newUnitId: string) => {
    setUnitId(newUnitId);
    setSelectedNode(null);
    const url = new URL(window.location.href);
    url.searchParams.set('unit', newUnitId);
    window.history.replaceState({}, '', url.toString());
  }, []);

  if (!unit || !student) {
    return (
      <div className="student-detail">
        <header className="header">
          <h1>Math Insight Map</h1>
          <p className="subtitle">読み込み中…</p>
        </header>
      </div>
    );
  }

  return (
    <div className="student-detail">
      <header className="header">
        <h1>Math Insight Map</h1>
        <p className="subtitle">
          生徒: {student.name} / 単元:{' '}
          <select
            className="unit-select"
            value={unitId}
            onChange={(e) => handleUnitChange(e.target.value)}
            aria-label="単元を選択"
          >
            {AVAILABLE_UNITS.map((meta) => (
              <option key={meta.unit_id} value={meta.unit_id}>
                {meta.unit_name}（{meta.grade}）
              </option>
            ))}
          </select>
        </p>
      </header>
      <div className="main-layout">
        <div className="graph-area">
          <GraphView
            flowNodes={flowNodes}
            flowEdges={flowEdges}
            onNodeSelect={setSelectedNode}
          />
        </div>
        <aside className="panel-area">
          <NodeDetailPanel
            node={selectedNode}
            level={selectedLevel}
            memo={selectedMemo}
            lastChecked={selectedLastChecked}
            onLevelChange={(level) =>
              selectedNode && handleLevelChange(selectedNode.id, level)
            }
            onMemoChange={(memo) =>
              selectedNode && handleMemoChange(selectedNode.id, memo)
            }
          />
        </aside>
      </div>
    </div>
  );
}
