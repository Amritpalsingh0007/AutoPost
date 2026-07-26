import React, { useEffect, useState } from 'react';
import { NavBar } from './NavBar';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { TrackedRepo } from '../types';
import { api, normalizeRepoUrl, validateRepoUrl, getErrorMessage } from '../services/api';
import { WeeklyGrid } from './WeeklyGrid';
import { Modal } from './Modal';
import { FormInput } from './FormInput';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repos, setRepos] = useState<TrackedRepo[]>([]);
  const location = useLocation();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.repos.list().then(setRepos).catch(() => {
      // Silently swallow — the interceptor handles auth errors globally.
    });

    const handleOpenModal = () => setAddModalOpen(true);
    window.addEventListener('openAddRepoModal', handleOpenModal);
    return () => window.removeEventListener('openAddRepoModal', handleOpenModal);
  }, [location.pathname]); // Refresh repos when navigating

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    // Normalise before validating so users can paste URLs with .git / trailing slashes.
    const normalised = normalizeRepoUrl(newRepoUrl);
    const validationError = validateRepoUrl(normalised);
    if (validationError) {
      setAddError(validationError);
      return;
    }

    setAddLoading(true);
    try {
      const newRepo = await api.repos.add(normalised);
      setRepos([...repos, newRepo]);
      setAddModalOpen(false);
      setNewRepoUrl('');
      navigate(`/repos/${newRepo.id}`);
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setAddLoading(false);
    }
  };

  const NavItem = ({ to, label }: { to: string, label: string }) => {
    const active = location.pathname.startsWith(to) && (to !== '/dashboard' || location.pathname === '/dashboard');
    return (
      <Link to={to} style={{
        padding: 'var(--s-xs) var(--s-sm)',
        borderRadius: 'var(--r-sm)',
        display: 'block',
        color: 'var(--c-ink)',
        textDecoration: 'none',
        backgroundColor: active ? 'var(--c-canvas-soft-2)' : 'transparent',
        borderLeft: active ? '3px solid var(--c-link)' : '3px solid transparent'
      }} className="t-body-sm">
        {label}
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: '260px',
          backgroundColor: 'var(--c-canvas)',
          color: 'var(--c-ink)',
          borderRight: '1px solid var(--c-hairline)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--s-md)',
          gap: 'var(--s-lg)',
          overflowY: 'auto'
        }} className="desktop-only">
          <div style={{ fontWeight: 500 }} className="t-body-sm-strong">AutoPost</div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/history" label="History" />
            <NavItem to="/notes" label="Notes" />
            <NavItem to="/settings" label="Settings" />
          </nav>

          <div style={{ marginTop: 'var(--s-md)' }}>
            <div className="t-caption-mono" style={{ color: 'var(--c-hairline-strong)', marginBottom: 'var(--s-sm)' }}>TRACKED REPOS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-sm)' }}>
              {repos.map(r => (
                <Link key={r.id} to={`/repos/${r.id}`} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="t-body-sm">{r.repoUrl.split('/').pop()}</span>
                  <WeeklyGrid weeks={r.weeklyGrid.slice(0, 6)} />
                </Link>
              ))}
              <button
                onClick={() => setAddModalOpen(true)}
                style={{ color: 'var(--c-link)', textAlign: 'left', marginTop: 'var(--s-sm)' }}
                className="t-body-sm"
              >
                + Add repo
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          backgroundColor: 'var(--c-canvas-soft)',
          overflowY: 'auto',
          padding: 'var(--s-lg)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '1200px' }}>
            {children}
          </div>
        </main>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => { setAddModalOpen(false); setAddError(''); setNewRepoUrl(''); }} title="Add a repository">
        <form onSubmit={handleAddRepo} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-lg)' }}>
          <FormInput
            placeholder="https://github.com/username/repo-name"
            value={newRepoUrl}
            onChange={e => { setNewRepoUrl(e.target.value); setAddError(''); }}
            error={addError}
            autoFocus
          />
          <button type="submit" className="button-primary" disabled={addLoading}>
            {addLoading ? 'Reading the project...' : 'Add repo'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
