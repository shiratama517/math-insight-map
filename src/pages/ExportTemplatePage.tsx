import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUnitTemplate } from '../data/unitRegistry';
import { loadCustomTemplate } from '../lib/templateStorage';

export function ExportTemplatePage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!unitId) {
      navigate('/templates');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const custom = loadCustomTemplate(unitId);
        const template = custom ?? await getUnitTemplate(unitId);
        if (cancelled) return;
        const blob = new Blob([JSON.stringify(template, null, 2)], {
          type: 'application/json',
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `template-${template.unit_id}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {
        if (!cancelled) alert('テンプレートの取得に失敗しました。');
      }
      if (!cancelled) navigate('/templates');
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId, navigate]);

  return (
    <div className="template-list-page">
      <header className="header">
        <h1>Math Insight Map</h1>
        <p className="subtitle">
          <Link to="/templates" className="back-link">← テンプレート一覧</Link>
        </p>
      </header>
      <main className="list-main">
        <p>JSON をダウンロードしています…</p>
      </main>
    </div>
  );
}
