import { Outlet } from 'react-router-dom';
import AuditorSidebar from './AuditorSidebar';
import SupportDrawer from './SupportDrawer';

export default function AuditorLayout() {
  return (
    <div className="app-layout">
      <AuditorSidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <SupportDrawer />
    </div>
  );
}
