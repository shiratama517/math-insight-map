import type { UnitTemplate } from './types';
import { loadCustomTemplate } from '../lib/templateStorage';

export interface UnitMeta {
  unit_id: string;
  unit_name: string;
  grade: string;
}

/** 組み込み単元メタ。新単元追加時はここに1行追加し、getBuiltInTemplate に分岐を追加する */
const BUILT_IN_UNITS: UnitMeta[] = [
  { unit_id: 'quadratic_function', unit_name: '二次関数', grade: '高校1年' },
  { unit_id: 'square_root', unit_name: '平方根', grade: '中学3年' },
  { unit_id: 'trigonometric_ratio', unit_name: '三角比', grade: '高校1年' },
];

/** 組み込み＋カスタムを合わせた利用可能な単元一覧（カスタムは localStorage から都度取得） */
export function getAvailableUnits(): UnitMeta[] {
  const custom = loadCustomTemplatesForMeta();
  return [...BUILT_IN_UNITS, ...custom];
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
