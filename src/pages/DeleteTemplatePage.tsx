import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadCustomTemplate, deleteCustomTemplate } from '../lib/templateStorage';

export function DeleteTemplatePage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const template = unitId ? loadCustomTemplate(unitId) : null;

  const handleDelete = () => {
    if (!unitId) return;
    deleteCustomTemplate(unitId);
    navigate('/templates');
  };

  if (!unitId) {
    navigate('/templates');
    return null;
  }

  if (!template) {
    return (
      <div className="template-list-page">
        <header className="header">
          <h1>Math Insight Map</h1>
          <p className="subtitle">
            <Link to="/templates" className="back-link">← テンプレート一覧</Link>
          </p>
        </header>
        <main className="list-main">
          <p>カスタム単元が見つかりません。</p>
          <Link to="/templates" className="student-link" style={{ display: 'inline-block', marginTop: '1rem' }}>
            テンプレート一覧へ
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="template-list-page">
      <header className="header">
        <h1>Math Insight Map</h1>
        <p className="subtitle">
          <Link to="/templates" className="back-link">← テンプレート一覧</Link>
        </p>
      </header>
      <main className="list-main">
        <h2>削除の確認</h2>
        <p>
          「<strong>{template.unit_name}</strong>」（{template.unit_id}）を削除しますか？
          生徒の進捗データは残りますが、この単元は選択できなくなります。
        </p>
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/templates')}>
            キャンセル
          </button>
          <button type="button" className="btn-danger" onClick={handleDelete}>
            削除する
          </button>
        </div>
      </main>
    </div>
  );
}
