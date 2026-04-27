import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import SupportDrawer from './SupportDrawer';

export default function AdminLayout() {
  return (
    <div className="app-layout">
      <AdminSidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <SupportDrawer />
    </div>
  );
}
