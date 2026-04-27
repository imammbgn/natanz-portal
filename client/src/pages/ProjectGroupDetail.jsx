import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../api';
import {
  HiOutlineFolder,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

export default function ProjectGroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  function loadGroup() {
    setLoading(true);
    api.get(`/project-groups/${id}`)
      .then((res) => {
        const data = res.data.data;
        setGroup(data);
        setForm({
          name: data.name,
          description: data.description,
          status: data.status,
          region: data.region,
          environment: data.environment,
        });
      })
      .catch(() => navigate('/project-groups'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadGroup(); }, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/project-groups/${id}`, form);
      setShowEditModal(false);
      loadGroup();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/project-groups/${id}`);
      navigate('/project-groups');
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Project Group" />
        <div className="page-content"><div className="spinner" /></div>
      </>
    );
  }

  return (
    <>
      <Header title={group?.name || 'Project Group'} />
      <div className="page-content">
        <div className="detail-header">
          <div className="detail-breadcrumb">
            <Link to="/project-groups">Project Groups</Link>
            <span>/</span>
            <span>{group?.name}</span>
          </div>
          <div className="detail-actions">
            <Button variant="secondary" onClick={() => setShowEditModal(true)}>
              <HiOutlinePencil /> Edit
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              <HiOutlineTrash /> Delete
            </Button>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-info-card">
            <h3>Project Group Information</h3>
            <div className="detail-rows">
              <div className="detail-row">
                <span className="detail-label">ID</span>
                <span className="detail-value mono">{group?.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Name</span>
                <span className="detail-value">{group?.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description</span>
                <span className="detail-value">{group?.description || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-badge status-${group?.status}`}>{group?.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Region</span>
                <span className="detail-value">{group?.region}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Environment</span>
                <span className="detail-value">{group?.environment}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Resources</span>
                <span className="detail-value">{group?.resource_count}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created</span>
                <span className="detail-value">{new Date(group?.created_at).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Updated</span>
                <span className="detail-value">{new Date(group?.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="detail-cases">
            <h3>Related Support Cases</h3>
            {group?.cases?.length > 0 ? (
              <div className="cases-list">
                {group.cases.map((c) => (
                  <Link to={`/support/${c.id}`} key={c.id} className="case-item">
                    <div className="case-item-info">
                      <span className="case-item-title">{c.title}</span>
                      <span className="case-item-meta">{c.category}</span>
                    </div>
                    <span className={`status-badge status-${c.status}`}>{c.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state-small">
                <HiOutlineExclamationCircle />
                <p>No support cases for this project.</p>
                <Link to="/support" className="link-btn">Submit a case</Link>
              </div>
            )}
          </div>
        </div>

        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project Group">
          <form onSubmit={handleUpdate} className="modal-form">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </Select>
            <Select label="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
              <option value="id-jakarta-1">Jakarta (id-jakarta-1)</option>
              <option value="id-surabaya-1">Surabaya (id-surabaya-1)</option>
              <option value="sg-singapore-1">Singapore (sg-singapore-1)</option>
            </Select>
            <Select label="Environment" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </Select>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Project Group">
          <div className="confirm-delete">
            <p>Are you sure you want to delete <strong>{group?.name}</strong>?</p>
            <p className="text-muted">This action cannot be undone.</p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
