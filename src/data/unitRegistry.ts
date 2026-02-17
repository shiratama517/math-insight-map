import type { UnitTemplate } from './types';

export interface UnitMeta {
  unit_id: string;
  unit_name: string;
  grade: string;
}

/** 利用可能な単元一覧。新単元追加時はここに1行追加し、getUnitTemplate に分岐を追加する */
export const AVAILABLE_UNITS: UnitMeta[] = [
  { unit_id: 'quadratic_function', unit_name: '二次関数', grade: '高校1年' },
  { unit_id: 'square_root', unit_name: '平方根', grade: '中学3年' },
  { unit_id: 'trigonometric_ratio', unit_name: '三角比', grade: '高校1年' },
];

/** 単元IDからテンプレートを取得する（動的 import） */
export async function getUnitTemplate(unitId: string): Promise<UnitTemplate> {
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
