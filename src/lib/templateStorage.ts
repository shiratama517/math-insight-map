import type { UnitTemplate } from '../data/types';

const STORAGE_KEY_CUSTOM_TEMPLATES = 'math-insight-map-custom-templates';

/** カスタム単元テンプレート一覧を取得 */
export function loadCustomTemplates(): UnitTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_TEMPLATES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidUnitTemplate);
  } catch {
    return [];
  }
}

function isValidUnitTemplate(t: unknown): t is UnitTemplate {
  if (!t || typeof t !== 'object') return false;
  const o = t as Record<string, unknown>;
  return (
    typeof o.unit_id === 'string' &&
    typeof o.unit_name === 'string' &&
    Array.isArray(o.nodes) &&
    (o.grade === undefined || typeof o.grade === 'string') &&
    (o.description === undefined || typeof o.description === 'string') &&
    (o.prerequisite_unit_ids === undefined ||
      (Array.isArray(o.prerequisite_unit_ids) && (o.prerequisite_unit_ids as unknown[]).every((id) => typeof id === 'string')))
  );
}

/** カスタムテンプレートを保存（上書き or 追加） */
export function saveCustomTemplate(template: UnitTemplate): void {
  const list = loadCustomTemplates();
  const index = list.findIndex((t) => t.unit_id === template.unit_id);
  const next =
    index >= 0
      ? list.map((t, i) => (i === index ? template : t))
      : [...list, template];
  localStorage.setItem(STORAGE_KEY_CUSTOM_TEMPLATES, JSON.stringify(next));
}

/** カスタムテンプレートを unit_id で取得 */
export function loadCustomTemplate(unitId: string): UnitTemplate | null {
  return loadCustomTemplates().find((t) => t.unit_id === unitId) ?? null;
}

/** カスタムテンプレートを削除 */
export function deleteCustomTemplate(unitId: string): void {
  const next = loadCustomTemplates().filter((t) => t.unit_id !== unitId);
  localStorage.setItem(STORAGE_KEY_CUSTOM_TEMPLATES, JSON.stringify(next));
}
