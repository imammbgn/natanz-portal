import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '', company: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
      });
    }
  }, [user]);

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setSavingProfile(true);
    try {
      const res = await api.put('/user/profile', profileForm);
      updateUser(res.data.data);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/user/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <Header title="Settings" />
      <div className="page-content">
        <div className="settings-grid">
          <Card title="Profile Information">
            <form onSubmit={handleProfileSave} className="settings-form">
              {profileMsg.text && <div className={`alert alert-${profileMsg.type}`}>{profileMsg.text}</div>}

              <div className="settings-profile-header">
                <div className="settings-avatar">
                  {(user?.full_name || user?.username || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h3>{user?.full_name || user?.username}</h3>
                  <span className="text-muted">@{user?.username} &middot; {user?.role}</span>
                </div>
              </div>

              <Input
                label="Full Name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                placeholder="Your full name"
              />
              <Input
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="your@email.com"
              />
              <Input
                label="Phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+62 xxx"
              />
              <Input
                label="Company"
                value={profileForm.company}
                onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                placeholder="Company name"
              />
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Card>

          <Card title="Change Password">
            <form onSubmit={handlePasswordChange} className="settings-form">
              {passwordMsg.text && <div className={`alert alert-${passwordMsg.type}`}>{passwordMsg.text}</div>}
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="Enter current password"
                required
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="Enter new password"
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="Confirm new password"
                required
              />
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
