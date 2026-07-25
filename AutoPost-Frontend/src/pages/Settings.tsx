import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FormInput } from '../components/FormInput';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("Passwords don't match");
    await api.auth.updatePassword();
    alert('Password updated');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    await api.auth.deleteAccount(user.id);
    logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="card" style={{ padding: 'var(--s-xl)', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: 'var(--s-xl)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-xs)' }}>
          <span className="t-body-sm-strong">Email</span>
          <span className="t-body-md" style={{ color: 'var(--c-body)' }}>{user?.email}</span>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-md)' }}>
          <h2 className="t-display-sm" style={{ margin: 0, marginBottom: 'var(--s-xs)' }}>Change password</h2>
          <FormInput type="password" label="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          <FormInput type="password" label="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
          <FormInput type="password" label="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          <button type="submit" className="button-primary-sm" style={{ alignSelf: 'flex-start', marginTop: 'var(--s-xs)' }}>
            Update password
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--c-hairline)', paddingTop: 'var(--s-xl)' }}>
          <button className="t-body-sm" style={{ color: 'var(--c-error)', textDecoration: 'underline' }} onClick={() => setDeleteModalOpen(true)}>
            Delete account
          </button>
        </div>
      </div>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete account?">
        <p className="t-body-md" style={{ color: 'var(--c-body)', margin: 0 }}>
          Are you sure? This action is permanent and cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 'var(--s-sm)', justifyContent: 'flex-end', marginTop: 'var(--s-md)' }}>
          <button className="button-secondary-sm" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
          <button className="button-primary-sm" style={{ backgroundColor: 'var(--c-error)' }} onClick={handleDeleteAccount}>Delete account</button>
        </div>
      </Modal>
    </div>
  );
};
