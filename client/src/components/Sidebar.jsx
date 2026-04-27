import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSupportDrawer } from './SupportDrawer';
import {
  HiOutlineViewGrid,
  HiOutlineFolder,
  HiOutlineSupport,
  HiOutlineCog,
  HiOutlineLogout,
} from 'react-icons/hi';

const navItems = [
  { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/project-groups', icon: HiOutlineFolder, label: 'Project Groups' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const { setIsOpen } = useSupportDrawer();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg width="28" height="28" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="#3b82f6" />
            <text x="16" y="22" fontFamily="Arial" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">N</text>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">Natanz Cloud</span>
          <span className="brand-sub">Management Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive || (item.to !== '/dashboard' && location.pathname.startsWith(item.to)) ? 'active' : ''}`
            }
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <button className="nav-item" onClick={() => setIsOpen(true)}>
          <HiOutlineSupport className="nav-icon" />
          <span>Support</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={logout}>
          <HiOutlineLogout className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
