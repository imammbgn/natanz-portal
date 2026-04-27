import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSupportDrawer } from './SupportDrawer';
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineTerminal,
  HiOutlineCode,
  HiOutlineLogout,
} from 'react-icons/hi';

const navItems = [
  { to: '/admin', icon: HiOutlineViewGrid, label: 'Dashboard', exact: true },
  { to: '/admin/users', icon: HiOutlineUsers, label: 'User Management' },
  { to: '/admin/scripts', icon: HiOutlineTerminal, label: 'Script Management' },
  { to: '/admin/console', icon: HiOutlineCode, label: 'Console' },
];

export default function AdminSidebar() {
  const { logout, user } = useAuth();
  const { setIsOpen } = useSupportDrawer();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg width="28" height="28" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="#dc2626" />
            <text x="16" y="22" fontFamily="Arial" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">N</text>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">Natanz Cloud</span>
          <span className="brand-sub">Admin Console</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-badge">
          <span className="role-badge" style={{ background: 'rgba(220,38,38,0.2)', color: '#fca5a5' }}>ADMIN</span>
        </div>
        <button className="nav-item logout-btn" onClick={logout}>
          <HiOutlineLogout className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
