import { useMemo, useState, useCallback } from 'react';
import template from '../data/quadraticFunctionTemplate.json';
import type { UnitTemplate, NodeTemplate, UnderstandingLevel } from '../data/types';
import { buildFlowGraph } from '../utils/graphBuilder';
import { loadStudent, saveStudent, createInitialStudent } from '../lib/storage';
import { GraphView } from '../components/GraphView';
import { NodeDetailPanel } from '../components/NodeDetailPanel';

const STUDENT_ID = 'student-demo';
const unit = template as UnitTemplate;

function getLevel(
  nodeStatus: Record<string, { understanding_level: UnderstandingLevel }>,
  nodeId: string
): UnderstandingLevel {
  return nodeStatus[nodeId]?.understanding_level ?? 0;
}

export function StudentDetailPage() {
  const [student, setStudent] = useState(() => {
    const loaded = loadStudent(STUDENT_ID);
    if (loaded) return loaded;
    return createInitialStudent(
      STUDENT_ID,
      'デモ生徒',
      unit.nodes.map((n) => n.id)
    );
  });

  const [selectedNode, setSelectedNode] = useState<NodeTemplate | null>(null);

  const getLevelForNode = useCallback(
    (nodeId: string) => getLevel(student.nodeStatus, nodeId),
    [student.nodeStatus]
  );

  const { flowNodes, flowEdges } = useMemo(
    () =>
      buildFlowGraph({
        nodes: unit.nodes,
        getLevel: getLevelForNode,
      }),
    [getLevelForNode]
  );

  const selectedLevel =
    selectedNode ? getLevelForNode(selectedNode.id) : 0;
  const selectedStatus = selectedNode
    ? student.nodeStatus[selectedNode.id]
    : undefined;
  const selectedMemo = selectedStatus?.memo ?? '';
  const selectedLastChecked = selectedStatus?.last_checked;

  const handleLevelChange = useCallback(
    (nodeId: string, level: UnderstandingLevel) => {
      setStudent((prev) => {
        const next = {
          ...prev,
          nodeStatus: {
            ...prev.nodeStatus,
            [nodeId]: {
              ...prev.nodeStatus[nodeId],
              node_id: nodeId,
              understanding_level: level,
              last_checked: new Date().toISOString().slice(0, 10),
              memo: prev.nodeStatus[nodeId]?.memo ?? '',
            },
          },
        };
        saveStudent(next);
        return next;
      });
    },
    []
  );

  const handleMemoChange = useCallback(
    (nodeId: string, memo: string) => {
      setStudent((prev) => {
        const next = {
          ...prev,
          nodeStatus: {
            ...prev.nodeStatus,
            [nodeId]: {
              ...prev.nodeStatus[nodeId],
              node_id: nodeId,
              understanding_level: prev.nodeStatus[nodeId]?.understanding_level ?? 0,
              last_checked: prev.nodeStatus[nodeId]?.last_checked,
              memo,
            },
          },
        };
        saveStudent(next);
        return next;
      });
    },
    []
  );

  return (
    <div className="student-detail">
      <header className="header">
        <h1>Math Insight Map</h1>
        <p className="subtitle">
          生徒: {student.name} / 単元: {unit.unit_name}
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
      {/* TODO Phase 2: bottleneck detection, multiple students, unit switching */}
    </div>
  );
}
