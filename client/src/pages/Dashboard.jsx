import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { StatCard } from '../components/ui/Card';
import { useSupportDrawer } from '../components/SupportDrawer';
import api from '../api';
import {
  HiOutlineFolder,
  HiOutlineLightningBolt,
  HiOutlineExclamationCircle,
  HiOutlineServer,
  HiOutlineArrowRight,
} from 'react-icons/hi';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setIsOpen: openSupportDrawer } = useSupportDrawer();

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="page-content"><div className="spinner" /></div>
      </>
    );
  }

  const { stats, recentProjects, recentCases } = data || {};

  return (
    <>
      <Header title="Dashboard" />
      <div className="page-content">
        <div className="stats-grid">
          <StatCard icon={<HiOutlineFolder />} label="Project Groups" value={stats?.projectGroups || 0} color="blue" />
          <StatCard icon={<HiOutlineLightningBolt />} label="Active Projects" value={stats?.activeProjects || 0} color="green" />
          <StatCard icon={<HiOutlineExclamationCircle />} label="Open Cases" value={stats?.openCases || 0} color="orange" />
          <StatCard icon={<HiOutlineServer />} label="Total Resources" value={stats?.totalResources || 0} color="purple" />
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Projects</h2>
              <Link to="/project-groups" className="section-link">
                View All <HiOutlineArrowRight />
              </Link>
            </div>
            <div className="recent-list">
              {recentProjects?.length > 0 ? (
                recentProjects.map((project) => (
                  <Link to={`/project-groups/${project.id}`} key={project.id} className="recent-item">
                    <div className="recent-item-info">
                      <span className="recent-item-name">{project.name}</span>
                      <span className="recent-item-meta">{project.region} &middot; {project.environment}</span>
                    </div>
                    <span className={`status-badge status-${project.status}`}>{project.status}</span>
                  </Link>
                ))
              ) : (
                <div className="empty-state-small">
                  <p>No project groups yet.</p>
                  <Link to="/project-groups" className="link-btn">Create your first project</Link>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Support Cases</h2>
              <Link to="/support" className="section-link">
                View All <HiOutlineArrowRight />
              </Link>
            </div>
            <div className="recent-list">
              {recentCases?.length > 0 ? (
                recentCases.map((c) => (
                  <div key={c.id} className="recent-item">
                    <div className="recent-item-info">
                      <span className="recent-item-name">{c.title}</span>
                      <span className="recent-item-meta">{c.category} &middot; {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="recent-item-badges">
                      <span className={`priority-badge priority-${c.priority}`}>{c.priority}</span>
                      <span className={`status-badge status-${c.status}`}>{c.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-small">
                  <p>No support cases.</p>
                  <button className="link-btn" onClick={() => openSupportDrawer(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 500, fontSize: '0.85rem' }}>Submit a case</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
