import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAvailableUnitsGroupedBySubject } from '../data/unitRegistry';
import { loadStudentIds, loadStudent } from '../lib/storage';

export function UnitMapPage() {
  const [searchParams] = useSearchParams();
  const studentIdFromUrl = searchParams.get('student') ?? '';
  const [selectedStudentId, setSelectedStudentId] = useState(studentIdFromUrl);
  useEffect(() => {
    if (studentIdFromUrl) setSelectedStudentId(studentIdFromUrl);
  }, [studentIdFromUrl]);

  const studentIds = useMemo(() => loadStudentIds(), []);
  const students = useMemo(() => {
    return studentIds
      .map((id) => loadStudent(id))
      .filter((s): s is NonNullable<typeof s> => s != null)
      .map((s) => ({ id: s.student_id, name: s.name }));
  }, [studentIds]);

  const grouped = useMemo(() => getAvailableUnitsGroupedBySubject(), []);
  const hasStudent = selectedStudentId && students.some((s) => s.id === selectedStudentId);

  return (
    <div className="unit-map-page">
      <header className="header">
        <h1>Math Insight Map</h1>
        <p className="subtitle">
          <Link to="/" className="back-link">← 生徒一覧</Link>
          <span style={{ margin: '0 0.5rem' }}>|</span>
          <span>単元マップ</span>
        </p>
      </header>
      <main className="list-main" style={{ maxWidth: '40rem' }}>
        <p className="section-desc" style={{ marginBottom: '1rem' }}>
          科目ごとの単元一覧です。生徒を選んでから単元をクリックすると、その単元の理解地図を開きます。
        </p>
        {hasStudent && (
          <p style={{ marginBottom: '1rem' }}>
            <Link to={`/unit-map/understanding?student=${selectedStudentId}`} className="btn-link">
              単元ごとの理解度マップ
            </Link>
          </p>
        )}
        <div className="unit-map-student" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="unit-map-student-select">生徒を選択</label>
          <select
            id="unit-map-student-select"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            aria-label="生徒を選択"
            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem' }}
          >
            <option value="">— 選択してください —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {!hasStudent && selectedStudentId && (
          <p className="unit-map-message" style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
            選択された生徒が見つかりません。
          </p>
        )}
        <div className="unit-map-groups" aria-label="科目・単元一覧">
          {grouped.map((group) => (
            <section key={group.subject_name} className="unit-map-group" style={{ marginBottom: '1.5rem' }}>
              <h2 className="unit-map-subject" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {group.subject_name}
              </h2>
              <ul className="template-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
                {group.units.map((u) => {
                  const href = hasStudent ? `/student/${selectedStudentId}?unit=${u.unit_id}` : undefined;
                  const content = (
                    <>
                      <span className="template-name">{u.unit_name}</span>
                      <span className="template-meta">（{u.grade}）</span>
                    </>
                  );
                  return (
                    <li key={u.unit_id} className="template-item" style={{ marginBottom: '0.25rem' }}>
                      {href ? (
                        <Link to={href} className="btn-link" style={{ display: 'inline-block' }}>
                          {content}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>{content}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
