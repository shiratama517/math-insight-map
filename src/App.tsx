import { Routes, Route } from 'react-router-dom';
import { StudentListPage } from './pages/StudentListPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { TemplateListPage } from './pages/TemplateListPage';
import { TemplateEditPage } from './pages/TemplateEditPage';
import { ExportTemplatePage } from './pages/ExportTemplatePage';
import { DeleteTemplatePage } from './pages/DeleteTemplatePage';
import './style.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentListPage />} />
      <Route path="/student/:id" element={<StudentDetailPage />} />
      <Route path="/templates" element={<TemplateListPage />} />
      <Route path="/templates/new" element={<TemplateEditPage />} />
      <Route path="/templates/edit/:unitId" element={<TemplateEditPage />} />
      <Route path="/templates/export/:unitId" element={<ExportTemplatePage />} />
      <Route path="/templates/delete/:unitId" element={<DeleteTemplatePage />} />
    </Routes>
  );
}
