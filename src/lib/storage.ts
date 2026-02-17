import type { Student, StudentNodeStatus } from '../data/types';

const STORAGE_KEY_PREFIX = 'math-insight-map-student-';

export function loadStudent(studentId: string): Student | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + studentId);
    if (!raw) return null;
    return JSON.parse(raw) as Student;
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

export function createInitialStudent(
  studentId: string,
  name: string,
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
    nodeStatus,
  };
}
