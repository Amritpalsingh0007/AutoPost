import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { WeeklyNote, TrackedRepo } from '../types';

export const Notes: React.FC = () => {
  const [notes, setNotes] = useState<WeeklyNote[]>([]);
  const [repos, setRepos] = useState<TrackedRepo[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<string>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.notes.list(),
      api.repos.list()
    ]).then(([n, r]) => {
      setNotes(n);
      setRepos(r);
      setLoading(false);
    });
  }, []);

  const d = new Date();
  const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6:1);
  const monday = new Date(d.setDate(diff));
  const weekOfStr = monday.toISOString().split('T')[0];

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    let repoId: number | null = null;
    if (selectedRepo !== 'none') {
      repoId = Number(selectedRepo);
    }

    const note = await api.notes.create({
      weekOf: weekOfStr,
      text: newNoteText,
      repoId,
    });

    setNotes([note, ...notes]);
    setNewNoteText('');
  };

  const handleDelete = async (id: number) => {
    await api.notes.remove(id);
    setNotes(notes.filter(n => n.id !== id));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-xl)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <header>
        <h1 className="t-display-md" style={{ margin: 0, marginBottom: 'var(--s-sm)' }}>Weekly Notes</h1>
        <p className="t-body-md" style={{ color: 'var(--c-body)', margin: 0, maxWidth: '640px' }}>
          Notes here get folded into that week's draft &mdash; use this for anything your commits don't show.
        </p>
      </header>

      <div className="card" style={{ padding: 'var(--s-lg)' }}>
        <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="t-caption-mono">{weekOfStr}</span>
            <select 
              value={selectedRepo} 
              onChange={e => setSelectedRepo(e.target.value)}
              className="t-body-sm"
              style={{ padding: 'var(--s-xs) var(--s-sm)', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-hairline)', backgroundColor: 'var(--c-canvas)', color: 'var(--c-ink)' }}
            >
              <option value="none">Not tied to a repo (General)</option>
              {repos.map(r => (
                <option key={r.id} value={r.id.toString()}>{r.repoUrl.split('/').pop()}</option>
              ))}
            </select>
          </div>
          
          <textarea
            value={newNoteText}
            onChange={e => setNewNoteText(e.target.value)}
            className="t-body-md"
            placeholder="What did you learn or struggle with this week?"
            style={{
              width: '100%',
              minHeight: '120px',
              backgroundColor: 'var(--c-canvas)',
              color: 'var(--c-ink)',
              border: '1px solid var(--c-hairline)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--s-sm)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          
          <button type="submit" className="button-primary-sm" style={{ alignSelf: 'flex-start' }} disabled={!newNoteText.trim()}>
            Save note
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-sm)' }}>
        {notes.map(note => (
          <div key={note.id} className="card" style={{ padding: 'var(--s-md)', boxShadow: 'var(--shadow-1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s-xs)' }}>
              <span className="t-caption-mono" style={{ color: 'var(--c-mute)' }}>
                {note.weekOf} &middot; {note.repoName || 'General'}
              </span>
              <button className="t-caption" style={{ color: 'var(--c-error)', textDecoration: 'underline' }} onClick={() => handleDelete(note.id)}>
                Delete
              </button>
            </div>
            <p className="t-body-md" style={{ color: 'var(--c-body)', margin: 0, whiteSpace: 'pre-wrap' }}>
              {note.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
