import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SupportDrawerProvider } from './components/SupportDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Layout from './components/Layout';
import AuditorLayout from './components/AuditorLayout';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectGroups from './pages/ProjectGroups';
import ProjectGroupDetail from './pages/ProjectGroupDetail';
import Support from './pages/Support';
import Settings from './pages/Settings';
import AuditorDashboard from './pages/auditor/AuditorDashboard';
import AuditorCases from './pages/auditor/AuditorCases';
import AuditorUsers from './pages/auditor/AuditorUsers';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminScripts from './pages/admin/AdminScripts';
import AdminConsole from './pages/admin/AdminConsole';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SupportDrawerProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer routes */}
            <Route element={<ProtectedRoute><RoleGuard allowedRoles={['customer', 'support']}><Layout /></RoleGuard></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/project-groups" element={<ProjectGroups />} />
              <Route path="/project-groups/:id" element={<ProjectGroupDetail />} />
              <Route path="/support" element={<Support />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Auditor routes */}
            <Route element={<ProtectedRoute><RoleGuard allowedRoles={['auditor']}><AuditorLayout /></RoleGuard></ProtectedRoute>}>
              <Route path="/auditor" element={<AuditorDashboard />} />
              <Route path="/auditor/cases" element={<AuditorCases />} />
              <Route path="/auditor/users" element={<AuditorUsers />} />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute><RoleGuard allowedRoles={['admin']}><AdminLayout /></RoleGuard></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/scripts" element={<AdminScripts />} />
              <Route path="/admin/console" element={<AdminConsole />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SupportDrawerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
