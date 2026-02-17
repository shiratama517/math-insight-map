import type { Student, StudentNodeStatus } from '../data/types';

const STORAGE_KEY_PREFIX = 'math-insight-map-student-';
const STORAGE_KEY_STUDENT_IDS = 'math-insight-map-student-ids';

/** 配布時に残すデモ生徒のID */
export const DEMO_STUDENT_ID = 'student-demo';

/** 登録されている生徒ID一覧を取得。未設定の場合は従来のデモ生徒1件でマイグレーション */
export function loadStudentIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENT_IDS);
    if (!raw) return ['student-demo'];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return parsed.length > 0 ? parsed : ['student-demo'];
    }
    return ['student-demo'];
  } catch {
    return ['student-demo'];
  }
}

export function saveStudentIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY_STUDENT_IDS, JSON.stringify(ids));
}

/** 新規生徒を追加して保存し、ID一覧に登録して返す */
export function addStudent(
  studentId: string,
  name: string,
  unitId: string,
  nodeIds: string[]
): Student {
  const student = createInitialStudent(studentId, name, unitId, nodeIds);
  saveStudent(student);
  const ids = loadStudentIds();
  if (!ids.includes(studentId)) {
    saveStudentIds([...ids, studentId]);
  }
  return student;
}

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

const TODAY = () => new Date().toISOString().slice(0, 10);

/**
 * 全生徒の理解度・確認日・メモを初期化する（配布用）。
 * 生徒一覧や単元構成はそのまま、各ノードの understanding_level / last_checked / memo のみリセットする。
 * @returns 初期化した生徒数
 */
export function resetAllUnderstanding(): number {
  const ids = loadStudentIds();
  let count = 0;
  for (const id of ids) {
    const student = loadStudent(id);
    if (!student || !student.nodeStatusByUnit) continue;
    const nextByUnit: Student['nodeStatusByUnit'] = {};
    for (const [unitId, statusMap] of Object.entries(student.nodeStatusByUnit)) {
      if (!statusMap || typeof statusMap !== 'object') continue;
      const nextStatus: Record<string, StudentNodeStatus> = {};
      for (const [nodeId, status] of Object.entries(statusMap)) {
        nextStatus[nodeId] = {
          node_id: status.node_id ?? nodeId,
          understanding_level: 0,
          last_checked: TODAY(),
          memo: '',
        };
      }
      nextByUnit[unitId] = nextStatus;
    }
    saveStudent({
      ...student,
      nodeStatusByUnit: nextByUnit,
    });
    count += 1;
  }
  return count;
}

/**
 * デモ生徒以外の生徒をストレージから削除し、生徒ID一覧をデモのみにする（配布用）。
 * @returns 削除した生徒数
 */
export function removeStudentsExceptDemo(): number {
  const ids = loadStudentIds();
  let removed = 0;
  for (const id of ids) {
    if (id === DEMO_STUDENT_ID) continue;
    localStorage.removeItem(STORAGE_KEY_PREFIX + id);
    removed += 1;
  }
  saveStudentIds([DEMO_STUDENT_ID]);
  return removed;
}
