import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSupportDrawer } from './SupportDrawer';
import {
  HiOutlineChartBar,
  HiOutlineTicket,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineLogout,
} from 'react-icons/hi';

const navItems = [
  { to: '/auditor', icon: HiOutlineChartBar, label: 'Dashboard', exact: true },
  { to: '/auditor/cases', icon: HiOutlineTicket, label: 'Cases Audit' },
  { to: '/auditor/users', icon: HiOutlineUsers, label: 'User Audit' },
];

export default function AuditorSidebar() {
  const { logout } = useAuth();
  const { setIsOpen } = useSupportDrawer();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg width="28" height="28" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="#7c3aed" />
            <text x="16" y="22" fontFamily="Arial" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">N</text>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">Natanz Cloud</span>
          <span className="brand-sub">Auditor Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <button className="nav-item" onClick={() => setIsOpen(true)}>
          <HiOutlineClipboardList className="nav-icon" />
          <span>Support</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-badge">
          <span className="role-badge role-auditor">AUDITOR</span>
        </div>
        <button className="nav-item logout-btn" onClick={logout}>
          <HiOutlineLogout className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
