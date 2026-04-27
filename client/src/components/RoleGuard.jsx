import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap = {
      customer: '/dashboard',
      support: '/dashboard',
      auditor: '/auditor',
      admin: '/admin',
    };
    return <Navigate to={dashboardMap[user.role] || '/dashboard'} replace />;
  }

  return children;
}
