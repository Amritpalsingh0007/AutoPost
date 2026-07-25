import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { TrackedRepo, WeeklyDraft } from '../types';
import { WeeklyGrid } from '../components/WeeklyGrid';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const RepoDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repo, setRepo] = useState<TrackedRepo | null>(null);
  const [drafts, setDrafts] = useState<WeeklyDraft[]>([]);
  const [description, setDescription] = useState('');
  const [isDescDirty, setIsDescDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.repos.get(Number(id)),
      api.drafts.getForRepo(Number(id))
    ]).then(([r, d]) => {
      setRepo(r);
      setDescription(r.projectDescription);
      setDrafts(d);
      setLoading(false);
    }).catch(() => {
      navigate('/404');
    });
  }, [id, navigate]);

  const handleSaveDescription = async () => {
    if (!repo) return;
    await api.repos.updateDescription(repo.id, description);
    setIsDescDirty(false);
  };

  const handleGenerateNow = async () => {
    if (!repo) return;
    setGenerating(true);
    const newDraft = await api.drafts.generate(repo.id);
    setDrafts([newDraft, ...drafts]);
    setGenerating(false);
  };

  const handleRemove = async () => {
    if (!repo) return;
    await api.repos.remove(repo.id);
    navigate('/dashboard');
  };

  if (loading || !repo) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-xl)' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-sm)', marginBottom: 'var(--s-xs)' }}>
          <h1 className="t-display-md" style={{ margin: 0 }}>{repo.repoUrl.split('/').pop()}</h1>
          <a href={repo.repoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--c-mute)', textDecoration: 'none' }}>&#8599;</a>
        </div>
        <div className="t-caption-mono" style={{ color: 'var(--c-mute)' }}>Added on {new Date(repo.addedAt).toLocaleDateString()}</div>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-sm)' }}>
        <h2 className="t-body-sm-strong" style={{ margin: 0 }}>Project Description</h2>
        <div style={{ position: 'relative' }}>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setIsDescDirty(true);
            }}
            className="t-body-md"
            style={{
              width: '100%',
              minHeight: '100px',
              backgroundColor: 'var(--c-canvas)',
              color: 'var(--c-body)',
              border: '1px solid var(--c-hairline)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--s-lg)',
              boxShadow: 'var(--shadow-1)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {isDescDirty && (
            <button className="button-primary-sm" onClick={handleSaveDescription} style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
              Save
            </button>
          )}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-sm)' }}>
        <h2 className="t-body-sm-strong" style={{ margin: 0 }}>Weekly Activity</h2>
        <WeeklyGrid weeks={repo.weeklyGrid} />
        <span className="t-caption" style={{ color: 'var(--c-mute)' }}>Each square = one week.</span>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="t-body-sm-strong" style={{ margin: 0 }}>Drafts</h2>
          <button className="button-secondary-sm" onClick={handleGenerateNow} disabled={generating}>
            {generating ? 'Generating...' : 'Generate this week\'s draft now'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {drafts.map(draft => (
            <div key={draft.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--s-md) 0', borderBottom: '1px solid var(--c-hairline)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-md)' }}>
                <span className="t-caption-mono">{draft.weekOf}</span>
                <StatusBadge status={draft.status} />
              </div>
              <Link to={`/drafts/${draft.id}`} className="t-body-sm-strong" style={{ color: 'var(--c-link)' }}>Review</Link>
            </div>
          ))}
          {drafts.length === 0 && (
            <div className="t-body-sm" style={{ color: 'var(--c-mute)', padding: 'var(--s-md) 0' }}>No drafts generated yet.</div>
          )}
        </div>
      </section>

      <div style={{ marginTop: 'var(--s-2xl)' }}>
        <button className="t-body-sm" style={{ color: 'var(--c-mute)', textDecoration: 'underline' }} onClick={() => setRemoveModalOpen(true)}>
          Remove repository
        </button>
      </div>

      <Modal isOpen={removeModalOpen} onClose={() => setRemoveModalOpen(false)} title={`Remove ${repo.repoUrl.split('/').pop()}?`}>
        <p className="t-body-md" style={{ color: 'var(--c-body)', margin: 0 }}>This will delete all drafts for this repo.</p>
        <div style={{ display: 'flex', gap: 'var(--s-sm)', justifyContent: 'flex-end', marginTop: 'var(--s-md)' }}>
          <button className="button-secondary-sm" onClick={() => setRemoveModalOpen(false)}>Cancel</button>
          <button className="button-primary-sm" style={{ backgroundColor: 'var(--c-error)' }} onClick={handleRemove}>Remove</button>
        </div>
      </Modal>
    </div>
  );
};
