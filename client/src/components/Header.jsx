import { useAuth } from '../context/AuthContext';
import { HiOutlineBell } from 'react-icons/hi';

export default function Header({ title }) {
  const { user } = useAuth();

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="header-right">
        <button className="header-icon-btn">
          <HiOutlineBell />
        </button>
        <div className="header-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{user?.full_name || user?.username}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
