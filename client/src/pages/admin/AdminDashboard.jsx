import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { StatCard } from '../../components/ui/Card';
import api from '../../api';
import {
  HiOutlineUsers,
  HiOutlineTicket,
  HiOutlineFolder,
  HiOutlineCode,
  HiOutlineExclamationCircle,
  HiOutlinePlay,
} from 'react-icons/hi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <><Header title="Admin Dashboard" /><div className="page-content"><div className="spinner" /></div></>;

  const { stats, recentUsers, recentExecutions, usersByRole } = data || {};

  return (
    <>
      <Header title="Admin Dashboard" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={<HiOutlineUsers />} label="Total Users" value={stats?.totalUsers || 0} color="blue" />
          <StatCard icon={<HiOutlineFolder />} label="Project Groups" value={stats?.totalProjects || 0} color="green" />
          <StatCard icon={<HiOutlineExclamationCircle />} label="Open Cases" value={stats?.openCases || 0} color="orange" />
          <StatCard icon={<HiOutlineCode />} label="Scripts" value={stats?.totalScripts || 0} color="purple" />
          <StatCard icon={<HiOutlinePlay />} label="Executions" value={stats?.totalExecutions || 0} color="blue" />
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Users</h2>
            </div>
            <div className="recent-list">
              {recentUsers?.map((u) => (
                <div key={u.id} className="recent-item">
                  <div className="recent-item-info">
                    <span className="recent-item-name">{u.full_name || u.username}</span>
                    <span className="recent-item-meta">{u.email} &middot; {u.role}</span>
                  </div>
                  <span className={`status-badge ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {(!recentUsers || recentUsers.length === 0) && <div className="empty-state-small"><p>No users.</p></div>}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Script Executions</h2>
            </div>
            <div className="recent-list">
              {recentExecutions?.map((ex) => (
                <div key={ex.id} className="recent-item">
                  <div className="recent-item-info">
                    <span className="recent-item-name">{ex.script_name}</span>
                    <span className="recent-item-meta">by {ex.username} &middot; {ex.execution_time_ms}ms</span>
                  </div>
                  <span className={`status-badge status-${ex.status}`}>{ex.status}</span>
                </div>
              ))}
              {(!recentExecutions || recentExecutions.length === 0) && <div className="empty-state-small"><p>No executions yet.</p></div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
