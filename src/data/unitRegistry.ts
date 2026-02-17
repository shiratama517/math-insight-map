import type { UnitTemplate } from './types';
import { loadCustomTemplate } from '../lib/templateStorage';
import curriculumUnits from './curriculum_units.json';

export interface UnitMeta {
  unit_id: string;
  unit_name: string;
  grade: string;
  /** 科目名（単元マップ・グループ表示用） */
  subject?: string;
  /** 科目の表示順 */
  subject_order?: number;
  /** 科目内での単元の表示順 */
  unit_order?: number;
}

/** 組み込み単元ID一覧（テンプレート一覧の「組み込み」判定用） */
export function getBuiltInUnitIds(): string[] {
  return BUILT_IN_UNITS.map((u) => u.unit_id);
}

/** 組み込み単元メタ。新単元追加時はここに1行追加し、getBuiltInTemplate に分岐を追加する */
const BUILT_IN_UNITS: UnitMeta[] = [
  { unit_id: 'quadratic_function', unit_name: '二次関数', grade: '高校1年' },
  { unit_id: 'square_root', unit_name: '平方根', grade: '中学3年' },
  { unit_id: 'trigonometric_ratio', unit_name: '三角比', grade: '高校1年' },
  { unit_id: 'number_and_expression', unit_name: '数と式', grade: '高校1年' },
  { unit_id: 'data_analysis', unit_name: 'データの分析', grade: '高校1年' },
];

/** curriculum_units から unit_id に対する科目・順序のマップを生成 */
function getCurriculumMetaMap(): Map<string, { subject: string; subject_order: number; unit_order: number }> {
  const map = new Map<string, { subject: string; subject_order: number; unit_order: number }>();
  const subjects = (curriculumUnits as { subjects: Array<{ subject_name: string; order: number; units: Array<{ unit_id: string | null; order: number }> }> }).subjects;
  for (const sub of subjects) {
    for (const u of sub.units) {
      if (u.unit_id) {
        map.set(u.unit_id, { subject: sub.subject_name, subject_order: sub.order, unit_order: u.order });
      }
    }
  }
  return map;
}

/** 組み込み＋カスタムを合わせた利用可能な単元一覧（科目・順序付き。カスタムは localStorage から都度取得） */
export function getAvailableUnits(): UnitMeta[] {
  const custom = loadCustomTemplatesForMeta();
  const curriculumMap = getCurriculumMetaMap();
  const CUSTOM_SUBJECT_ORDER = 999;
  const builtInEnriched: UnitMeta[] = BUILT_IN_UNITS.map((u) => {
    const meta = curriculumMap.get(u.unit_id);
    return meta
      ? { ...u, subject: meta.subject, subject_order: meta.subject_order, unit_order: meta.unit_order }
      : { ...u, subject: u.grade || 'その他', subject_order: CUSTOM_SUBJECT_ORDER, unit_order: 0 };
  });
  const customEnriched: UnitMeta[] = custom.map((u, i) => ({
    ...u,
    subject: 'カスタム',
    subject_order: CUSTOM_SUBJECT_ORDER,
    unit_order: i,
  }));
  const all = [...builtInEnriched, ...customEnriched];
  all.sort((a, b) => (a.subject_order ?? 999) - (b.subject_order ?? 999) || (a.unit_order ?? 0) - (b.unit_order ?? 0));
  return all;
}

/** 科目ごとにグループ化した単元一覧（単元選択の optgroup 等に利用） */
export function getAvailableUnitsGroupedBySubject(): { subject_name: string; subject_order: number; units: UnitMeta[] }[] {
  const units = getAvailableUnits();
  const bySubject = new Map<string, UnitMeta[]>();
  const subjectOrderMap = new Map<string, number>();
  for (const u of units) {
    const key = u.subject ?? 'その他';
    if (!bySubject.has(key)) {
      bySubject.set(key, []);
      subjectOrderMap.set(key, u.subject_order ?? 999);
    }
    bySubject.get(key)!.push(u);
  }
  const result = Array.from(bySubject.entries()).map(([subject_name, unitsInSubject]) => ({
    subject_name,
    subject_order: subjectOrderMap.get(subject_name) ?? 999,
    units: unitsInSubject.sort((a, b) => (a.unit_order ?? 0) - (b.unit_order ?? 0)),
  }));
  result.sort((a, b) => a.subject_order - b.subject_order);
  return result;
}

/** カスタムテンプレートを UnitMeta の形で取得（unitRegistry の循環を避けるため直接読み込む） */
function loadCustomTemplatesForMeta(): UnitMeta[] {
  try {
    const raw = localStorage.getItem('math-insight-map-custom-templates');
    if (!raw) return [];
    const list = JSON.parse(raw) as UnitTemplate[];
    return (Array.isArray(list) ? list : []).map((t) => ({
      unit_id: t.unit_id,
      unit_name: t.unit_name,
      grade: t.grade ?? '',
    }));
  } catch {
    return [];
  }
}

/** @deprecated 互換用。getAvailableUnits() を使用してください */
export const AVAILABLE_UNITS: UnitMeta[] = BUILT_IN_UNITS;

/** 組み込みテンプレートを取得（動的 import） */
async function getBuiltInTemplate(unitId: string): Promise<UnitTemplate> {
  switch (unitId) {
    case 'quadratic_function':
      return (await import('./templates/quadratic_function.json')).default as UnitTemplate;
    case 'square_root':
      return (await import('./templates/square_root.json')).default as UnitTemplate;
    case 'trigonometric_ratio':
      return (await import('./templates/trigonometric_ratio.json')).default as UnitTemplate;
    case 'number_and_expression':
      return (await import('./templates/number_and_expression.json')).default as UnitTemplate;
    case 'data_analysis':
      return (await import('./templates/data_analysis.json')).default as UnitTemplate;
    default:
      throw new Error(`Unknown unit: ${unitId}`);
  }
}

/** 単元IDからテンプレートを取得。カスタムを優先し、なければ組み込みを返す */
export async function getUnitTemplate(unitId: string): Promise<UnitTemplate> {
  const custom = loadCustomTemplate(unitId);
  if (custom) return custom;
  return getBuiltInTemplate(unitId);
}
