import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAvailableUnitsGroupedBySubject, getBuiltInUnitIds } from '../data/unitRegistry';
import { loadCustomTemplates } from '../lib/templateStorage';

export function TemplateListPage() {
  const navigate = useNavigate();
  const builtInIds = useMemo(() => new Set(getBuiltInUnitIds()), []);
  const builtInGrouped = useMemo(
    () =>
      getAvailableUnitsGroupedBySubject().filter((g) =>
        g.units.some((u) => builtInIds.has(u.unit_id))
      ).map((g) => ({
        ...g,
        units: g.units.filter((u) => builtInIds.has(u.unit_id)),
      })),
    [builtInIds]
  );
  const custom = useMemo(() => loadCustomTemplates(), []);

  return (
    <div className="template-list-page">
      <header className="header">
        <h1>Math Insight Map</h1>
        <p className="subtitle">
          <Link to="/" className="back-link">← 生徒一覧</Link>
          <span style={{ margin: '0 0.5rem' }}>|</span>
          <span>単元テンプレート</span>
        </p>
      </header>
      <main className="list-main template-list-main">
        <section className="template-section">
          <h2>組み込み単元</h2>
          <p className="section-desc">編集するには「コピーして編集」でコピーを作成してください。</p>
          {builtInGrouped.map((group) => (
            <div key={group.subject_name} className="template-group" style={{ marginBottom: '1rem' }}>
              <h3 className="template-group-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{group.subject_name}</h3>
              <ul className="template-list" aria-label={`${group.subject_name} テンプレート一覧`}>
                {group.units.map((u) => (
                  <li key={u.unit_id} className="template-item">
                    <span className="template-name">{u.unit_name}</span>
                    <span className="template-meta">（{u.grade}）</span>
                    <div className="template-actions">
                      <Link
                        to={`/templates/new?copy=${u.unit_id}`}
                        className="btn-link"
                      >
                        コピーして編集
                      </Link>
                      <Link
                        to={`/templates/export/${u.unit_id}`}
                        className="btn-link btn-export"
                      >
                        JSONエクスポート
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <section className="template-section">
          <h2>カスタム単元</h2>
          <p className="section-desc">編集・削除・エクスポートができます。他講師とJSONで共有できます。</p>
          {custom.length === 0 ? (
            <p className="no-custom">カスタム単元はまだありません。</p>
          ) : (
            <ul className="template-list" aria-label="カスタムテンプレート一覧">
              {custom.map((u) => (
                <li key={u.unit_id} className="template-item">
                  <span className="template-name">{u.unit_name}</span>
                  <span className="template-meta">（{u.grade || '—'}）</span>
                  <div className="template-actions">
                    <Link to={`/templates/edit/${u.unit_id}`} className="btn-link">
                      編集
                    </Link>
                    <Link
                      to={`/templates/export/${u.unit_id}`}
                      className="btn-link btn-export"
                    >
                      JSONエクスポート
                    </Link>
                    <Link
                      to={`/templates/delete/${u.unit_id}`}
                      className="btn-link btn-danger"
                    >
                      削除
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn-add"
              onClick={() => navigate('/templates/new')}
              aria-label="新規単元を作成"
            >
              新規単元を作成
            </button>
            <label className="btn-import-label">
              JSONからインポート
              <input
                type="file"
                accept=".json,application/json"
                className="input-file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const text = reader.result as string;
                      const data = JSON.parse(text);
                      if (data?.unit_id && Array.isArray(data?.nodes)) {
                        navigate('/templates/new', { state: { template: data } });
                      } else {
                        alert('無効なテンプレートJSONです。');
                      }
                    } catch {
                      alert('JSONの読み込みに失敗しました。');
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </section>
      </main>
    </div>
  );
}
