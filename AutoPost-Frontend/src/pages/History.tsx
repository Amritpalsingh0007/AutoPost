import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { WeeklyDraft, TrackedRepo } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export const History: React.FC = () => {
  const [drafts, setDrafts] = useState<WeeklyDraft[]>([]);
  const [repos, setRepos] = useState<TrackedRepo[]>([]);
  const [filterRepo, setFilterRepo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.drafts.list(),
      api.repos.list()
    ]).then(([d, r]) => {
      setDrafts(d.sort((a,b) => b.weekOf.localeCompare(a.weekOf)));
      setRepos(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  const filteredDrafts = drafts.filter(d => {
    if (filterRepo !== 'all' && d.repoId.toString() !== filterRepo) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-xl)' }}>
      <header>
        <h1 className="t-display-md" style={{ margin: 0 }}>History</h1>
      </header>

      <div style={{ display: 'flex', gap: 'var(--s-md)', flexWrap: 'wrap' }}>
        <select 
          value={filterRepo} 
          onChange={e => setFilterRepo(e.target.value)}
          className="t-body-sm"
          style={{ padding: 'var(--s-xs) var(--s-sm)', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-hairline)', backgroundColor: 'var(--c-canvas)', color: 'var(--c-ink)' }}
        >
          <option value="all">All Repositories</option>
          {repos.map(r => (
            <option key={r.id} value={r.id.toString()}>{r.repoUrl.split('/').pop()}</option>
          ))}
        </select>

        <select 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)}
          className="t-body-sm"
          style={{ padding: 'var(--s-xs) var(--s-sm)', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-hairline)', backgroundColor: 'var(--c-canvas)', color: 'var(--c-ink)' }}
        >
          <option value="all">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="EDITED">Edited</option>
          <option value="POSTED">Posted</option>
          <option value="SKIPPED">Skipped</option>
        </select>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-hairline)', backgroundColor: 'var(--c-canvas-soft)' }}>
              <th className="t-caption-mono" style={{ padding: 'var(--s-md)', color: 'var(--c-mute)' }}>WEEK OF</th>
              <th className="t-caption-mono" style={{ padding: 'var(--s-md)', color: 'var(--c-mute)' }}>REPOSITORY</th>
              <th className="t-caption-mono" style={{ padding: 'var(--s-md)', color: 'var(--c-mute)' }}>STATUS</th>
              <th className="t-caption-mono" style={{ padding: 'var(--s-md)', color: 'var(--c-mute)' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrafts.map(draft => (
              <tr key={draft.id} style={{ borderBottom: '1px solid var(--c-hairline)' }}>
                <td className="t-caption-mono" style={{ padding: 'var(--s-md)' }}>{draft.weekOf}</td>
                <td className="t-body-sm-strong" style={{ padding: 'var(--s-md)' }}>{draft.repoName}</td>
                <td style={{ padding: 'var(--s-md)' }}><StatusBadge status={draft.status} /></td>
                <td style={{ padding: 'var(--s-md)' }}>
                  <Link to={`/drafts/${draft.id}`} className="t-body-sm" style={{ color: 'var(--c-link)' }}>Review</Link>
                </td>
              </tr>
            ))}
            {filteredDrafts.length === 0 && (
              <tr>
                <td colSpan={4} className="t-body-sm" style={{ padding: 'var(--s-md)', textAlign: 'center', color: 'var(--c-mute)' }}>
                  No drafts found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
