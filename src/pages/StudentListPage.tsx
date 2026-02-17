import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStudentIds, loadStudent, addStudent } from '../lib/storage';
import { getUnitTemplate } from '../data/unitRegistry';

const DEFAULT_UNIT_ID = 'quadratic_function';

export function StudentListPage() {
  const navigate = useNavigate();
  const [studentIds] = useState(() => loadStudentIds());
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const students = useMemo(() => {
    const rows: Array<{ id: string; name: string; grade?: string }> = [];
    for (const id of studentIds) {
      const s = loadStudent(id);
      if (s) rows.push({ id: s.student_id, name: s.name, grade: s.grade });
    }
    return rows;
  }, [studentIds]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const studentId = `student-${Date.now()}`;
    const unit = await getUnitTemplate(DEFAULT_UNIT_ID);
    const nodeIds = unit.nodes.map((n) => n.id);
    addStudent(studentId, name, DEFAULT_UNIT_ID, nodeIds);
    setNewName('');
    setIsAdding(false);
    navigate(`/student/${studentId}`);
  };

  return (
    <div className="student-list-page">
      <header className="header">
        <h1>Math Insight Map</h1>
        <p className="subtitle">生徒一覧</p>
      </header>
      <main className="list-main">
        <ul className="student-list" aria-label="生徒一覧">
          {students.map((s) => (
            <li key={s.id}>
              <Link to={`/student/${s.id}`} className="student-link">
                <span className="student-name">{s.name}</span>
                {s.grade && <span className="student-grade">{s.grade}</span>}
              </Link>
            </li>
          ))}
        </ul>
        {!isAdding ? (
          <button
            type="button"
            className="btn-add"
            onClick={() => setIsAdding(true)}
            aria-label="新規生徒を追加"
          >
            新規生徒を追加
          </button>
        ) : (
          <form onSubmit={handleAddStudent} className="form-add">
            <label htmlFor="new-student-name">名前</label>
            <input
              id="new-student-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="生徒名を入力"
              autoFocus
            />
            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={!newName.trim()}>
                追加
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                }}
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
