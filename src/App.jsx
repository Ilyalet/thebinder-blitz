import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import DocumentPage from '@/pages/Document';
import Tasks from '@/pages/Tasks';
import Reminders from '@/pages/Reminders';
import Calendar from '@/pages/Calendar';
import TagManager from '@/pages/TagManager';
import Settings from '@/pages/Settings';
import Help from '@/pages/Help';

function withLayout(Page, name) {
  return (
    <Layout currentPageName={name}>
      <Page />
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={withLayout(Dashboard, 'Dashboard')} />
      <Route path="/documents" element={withLayout(Documents, 'Documents')} />
      <Route path="/document" element={withLayout(DocumentPage, 'Document')} />
      <Route path="/tasks" element={withLayout(Tasks, 'Tasks')} />
      <Route path="/reminders" element={withLayout(Reminders, 'Reminders')} />
      <Route path="/calendar" element={withLayout(Calendar, 'Calendar')} />
      <Route path="/tagmanager" element={withLayout(TagManager, 'TagManager')} />
      <Route path="/settings" element={withLayout(Settings, 'Settings')} />
      <Route path="/help" element={withLayout(Help, 'Help')} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
