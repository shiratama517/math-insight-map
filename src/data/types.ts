/** 理解度スケール: 0=未学習, 1=見たことがある, 2=誘導ありでできる, 3=一人で解ける, 4=説明できる */
export type UnderstandingLevel = 0 | 1 | 2 | 3 | 4;

export interface NodeTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  prerequisites: string[];
  tags: string[];
}

export interface UnitTemplate {
  unit_id: string;
  unit_name: string;
  grade: string;
  description: string;
  nodes: NodeTemplate[];
}

export interface StudentNodeStatus {
  node_id: string;
  understanding_level: UnderstandingLevel;
  last_checked?: string;
  memo?: string;
}

export interface Student {
  student_id: string;
  name: string;
  grade?: string;
  school_type?: string;
  nodeStatus: Record<string, StudentNodeStatus>;
}
