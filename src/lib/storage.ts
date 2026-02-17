import type { Student, StudentNodeStatus } from '../data/types';

const STORAGE_KEY_PREFIX = 'math-insight-map-student-';

/** 従来の nodeStatus のみのデータを nodeStatusByUnit にマイグレーションする */
function migrateStudent(raw: Record<string, unknown>): Student {
  const base = raw as unknown as Student & { nodeStatus?: Record<string, StudentNodeStatus> };
  if (base.nodeStatusByUnit && typeof base.nodeStatusByUnit === 'object') {
    return base as Student;
  }
  if (base.nodeStatus && typeof base.nodeStatus === 'object') {
    const { nodeStatus, ...rest } = base;
    return {
      ...rest,
      nodeStatusByUnit: { quadratic_function: nodeStatus },
    } as Student;
  }
  return {
    ...base,
    nodeStatusByUnit: {},
  } as Student;
}

export function loadStudent(studentId: string): Student | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + studentId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return migrateStudent(parsed);
  } catch {
    return null;
  }
}

export function saveStudent(student: Student): void {
  localStorage.setItem(
    STORAGE_KEY_PREFIX + student.student_id,
    JSON.stringify(student)
  );
}

/** 単元の nodeStatus を初期化した Student を返す（新規生徒用） */
export function createInitialStudent(
  studentId: string,
  name: string,
  unitId: string,
  nodeIds: string[]
): Student {
  const nodeStatus: Record<string, StudentNodeStatus> = {};
  for (const id of nodeIds) {
    nodeStatus[id] = {
      node_id: id,
      understanding_level: 0,
      last_checked: new Date().toISOString().slice(0, 10),
      memo: '',
    };
  }
  return {
    student_id: studentId,
    name,
    nodeStatusByUnit: { [unitId]: nodeStatus },
  };
}

/** 指定単元の進捗が未初期化なら初期化して返す。既にあればそのまま返す */
export function ensureUnitStatus(
  student: Student,
  unitId: string,
  nodeIds: string[]
): Student {
  if (student.nodeStatusByUnit[unitId]) {
    return student;
  }
  const nodeStatus: Record<string, StudentNodeStatus> = {};
  for (const id of nodeIds) {
    nodeStatus[id] = {
      node_id: id,
      understanding_level: 0,
      last_checked: new Date().toISOString().slice(0, 10),
      memo: '',
    };
  }
  const next: Student = {
    ...student,
    nodeStatusByUnit: {
      ...student.nodeStatusByUnit,
      [unitId]: nodeStatus,
    },
  };
  saveStudent(next);
  return next;
}
