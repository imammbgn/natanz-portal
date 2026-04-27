import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { StatCard } from '../../components/ui/Card';
import api from '../../api';
import {
  HiOutlineUsers,
  HiOutlineTicket,
  HiOutlineExclamationCircle,
  HiOutlineFolder,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

export default function AuditorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auditor/dashboard')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Audit Dashboard" />
        <div className="page-content"><div className="spinner" /></div>
      </>
    );
  }

  const { stats, recentCases, charts } = data || {};

  return (
    <>
      <Header title="Audit Dashboard" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={<HiOutlineUsers />} label="Total Users" value={stats?.totalUsers || 0} color="blue" />
          <StatCard icon={<HiOutlineTicket />} label="Total Cases" value={stats?.totalCases || 0} color="purple" />
          <StatCard icon={<HiOutlineExclamationCircle />} label="Open Cases" value={stats?.openCases || 0} color="orange" />
          <StatCard icon={<HiOutlineCheckCircle />} label="Resolved Cases" value={stats?.resolvedCases || 0} color="green" />
          <StatCard icon={<HiOutlineFolder />} label="Project Groups" value={stats?.totalProjectGroups || 0} color="blue" />
        </div>

        <div className="dashboard-grid">
          {/* Recent Cases */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Support Cases</h2>
              <span className="section-link">View All</span>
            </div>
            <div className="recent-list">
              {recentCases?.length > 0 ? (
                recentCases.map((c) => (
                  <div key={c.id} className="recent-item">
                    <div className="recent-item-info">
                      <span className="recent-item-name">{c.title}</span>
                      <span className="recent-item-meta">
                        {c.full_name || c.username} &middot; {c.category} &middot; {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="recent-item-badges">
                      <span className={`priority-badge priority-${c.priority}`}>{c.priority}</span>
                      <span className={`status-badge status-${c.status}`}>{c.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-small"><p>No cases found.</p></div>
              )}
            </div>
          </div>

          {/* Charts / Distribution */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Case Distribution</h2>
            </div>
            <div className="recent-list">
              {/* By Status */}
              <div style={{ padding: '16px 22px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 12, color: '#475569' }}>By Status</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {charts?.casesByStatus?.map((item) => (
                    <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className={`status-badge status-${item.status}`} style={{ minWidth: 100, justifyContent: 'center' }}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          width: `${stats?.totalCases > 0 ? (item.count / stats.totalCases) * 100 : 0}%`,
                          height: '100%', background: '#3b82f6', borderRadius: 4,
                        }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', minWidth: 30, textAlign: 'right' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 12, color: '#475569' }}>By Category</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {charts?.casesByCategory?.map((item) => (
                    <span key={item.category} className="category-badge" style={{ fontSize: '0.8rem' }}>
                      {item.category}: {item.count}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 12, color: '#475569' }}>Users by Role</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {charts?.usersByRole?.map((item) => (
                    <span key={item.role} className="category-badge" style={{ fontSize: '0.8rem' }}>
                      {item.role}: {item.count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
