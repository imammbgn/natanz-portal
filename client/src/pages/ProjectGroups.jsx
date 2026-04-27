import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../api';
import { HiOutlinePlus, HiOutlineFolder, HiOutlineSearch } from 'react-icons/hi';

export default function ProjectGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', region: 'id-jakarta-1', environment: 'production' });
  const [creating, setCreating] = useState(false);

  function loadGroups() {
    setLoading(true);
    api.get('/project-groups', { params: search ? { search } : {} })
      .then((res) => setGroups(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadGroups(); }, []);

  function handleSearch(e) {
    e.preventDefault();
    loadGroups();
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await api.post('/project-groups', form);
      setShowModal(false);
      setForm({ name: '', description: '', region: 'id-jakarta-1', environment: 'production' });
      loadGroups();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Header title="Project Groups" />
      <div className="page-content">
        <div className="page-toolbar">
          <form className="search-box" onSubmit={handleSearch}>
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search project groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <Button onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> Add Project Group
          </Button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <HiOutlineFolder className="empty-icon" />
            <h3>No Project Groups</h3>
            <p>Create your first project group to get started.</p>
            <Button onClick={() => setShowModal(true)}>
              <HiOutlinePlus /> Add Project Group
            </Button>
          </div>
        ) : (
          <div className="project-grid">
            {groups.map((group) => (
              <Link to={`/project-groups/${group.id}`} key={group.id} className="project-card">
                <div className="project-card-header">
                  <h3>{group.name}</h3>
                  <span className={`status-badge status-${group.status}`}>{group.status}</span>
                </div>
                <p className="project-card-desc">{group.description || 'No description'}</p>
                <div className="project-card-meta">
                  <span>{group.region}</span>
                  <span>{group.environment}</span>
                  <span>{group.resource_count} resources</span>
                </div>
                <div className="project-card-footer">
                  <span className="text-muted">Updated {new Date(group.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project Group">
          <form onSubmit={handleCreate} className="modal-form">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Project group name"
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this project group"
              rows={3}
            />
            <Select
              label="Region"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            >
              <option value="id-jakarta-1">Jakarta (id-jakarta-1)</option>
              <option value="id-surabaya-1">Surabaya (id-surabaya-1)</option>
              <option value="sg-singapore-1">Singapore (sg-singapore-1)</option>
            </Select>
            <Select
              label="Environment"
              value={form.environment}
              onChange={(e) => setForm({ ...form, environment: e.target.value })}
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </Select>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
