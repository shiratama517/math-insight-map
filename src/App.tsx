import { Routes, Route } from 'react-router-dom';
import { StudentListPage } from './pages/StudentListPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import './style.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentListPage />} />
      <Route path="/student/:id" element={<StudentDetailPage />} />
    </Routes>
  );
}
