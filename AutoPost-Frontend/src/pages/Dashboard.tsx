import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { WeeklyDraft, TrackedRepo } from '../types';
import { DraftCard } from '../components/DraftCard';
import { EmptyState } from '../components/EmptyState';

export const Dashboard: React.FC = () => {
  const [drafts, setDrafts] = useState<WeeklyDraft[]>([]);
  const [repos, setRepos] = useState<TrackedRepo[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      api.drafts.list(),
      api.repos.list()
    ]).then(([fetchedDrafts, fetchedRepos]) => {
      setDrafts(fetchedDrafts);
      setRepos(fetchedRepos);
      setLoading(false);
    });
  }, []);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleMarkPosted = async (id: number) => {
    await api.drafts.update(id, { status: 'POSTED' });
    setDrafts(drafts.map(d => d.id === id ? { ...d, status: 'POSTED' } : d));
  };

  if (loading) {
    return <div className="t-body-md" style={{ color: 'var(--c-mute)' }}>Loading dashboard...</div>;
  }

  if (repos.length === 0) {
    return (
      <EmptyState 
        message="Add your first repo to get a draft this Saturday." 
        action={{ label: "Add a repo", onClick: () => {
          window.dispatchEvent(new CustomEvent('openAddRepoModal'));
        } }} 
      />
    );
  }

  const d = new Date();
  const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6:1);
  const monday = new Date(d.setDate(diff));
  const weekOfStr = monday.toISOString().split('T')[0];

  const thisWeeksDrafts = drafts.filter(d => d.weekOf === weekOfStr && d.status !== 'SKIPPED');
  const skippedRepos = repos.filter(r => !thisWeeksDrafts.find(d => d.repoId === r.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-xl)' }}>
      <header>
        <div className="t-caption-mono" style={{ color: 'var(--c-mute)', marginBottom: 'var(--s-xs)' }}>
          WEEK OF {weekOfStr}
        </div>
        <h1 className="t-display-md" style={{ margin: 0 }}>This week</h1>
      </header>

      {thisWeeksDrafts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-md)' }}>
          {thisWeeksDrafts.map(draft => (
            <DraftCard 
              key={draft.id} 
              draft={draft} 
              onCopy={handleCopy} 
              onMarkPosted={handleMarkPosted} 
            />
          ))}
        </div>
      ) : (
        <div className="card-soft" style={{ padding: 'var(--s-lg)' }}>
          <p className="t-body-md" style={{ color: 'var(--c-mute)', margin: 0 }}>No drafts generated yet for this week.</p>
        </div>
      )}

      {skippedRepos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-md)', marginTop: 'var(--s-xl)' }}>
          <h2 className="t-display-sm" style={{ color: 'var(--c-mute)' }}>Skipped this week</h2>
          {skippedRepos.map(repo => (
            <div key={repo.id} style={{ 
              backgroundColor: 'var(--c-canvas-soft)', 
              borderRadius: 'var(--r-md)', 
              padding: 'var(--s-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--s-xs)'
            }}>
              <span className="t-body-sm-strong">{repo.repoUrl.split('/').pop()}</span>
              <span className="t-body-sm" style={{ color: 'var(--c-mute)' }}>No activity this week &mdash; nothing generated.</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
