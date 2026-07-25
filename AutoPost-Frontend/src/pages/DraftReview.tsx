import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { WeeklyDraft } from '../types';

export const DraftReview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<WeeklyDraft | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markedPosted, setMarkedPosted] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    api.drafts.get(Number(id)).then(d => {
      setDraft(d);
      setContent(d.content);
    }).catch(() => navigate('/404'));
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (!draft) return;
      setSaving(true);
      await api.drafts.update(draft.id, { content: e.target.value, status: 'EDITED' });
      setDraft({ ...draft, content: e.target.value, status: 'EDITED' });
      setSaving(false);
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPosted = async () => {
    if (!draft) return;
    await api.drafts.update(draft.id, { status: 'POSTED' });
    setDraft({ ...draft, status: 'POSTED' });
    setMarkedPosted(true);
    setTimeout(() => setMarkedPosted(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!draft) return;
    setRegenerating(true);
    const newDraft = await api.drafts.generate(draft.repoId);
    setContent(newDraft.content);
    await api.drafts.update(draft.id, { content: newDraft.content, status: 'DRAFT' });
    setDraft({ ...draft, content: newDraft.content, status: 'DRAFT' });
    setRegenerating(false);
  };

  if (!draft) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-md)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div className="t-caption-mono" style={{ color: 'var(--c-mute)' }}>
        WEEK OF {draft.weekOf} &middot; {draft.repoName}
      </div>
      
      <div style={{ position: 'relative' }}>
        <textarea
          value={content}
          onChange={handleChange}
          className="t-body-lg"
          style={{
            width: '100%',
            minHeight: '300px',
            backgroundColor: 'var(--c-canvas)',
            color: 'var(--c-ink)',
            lineHeight: '28px',
            border: 'none',
            borderRadius: 'var(--r-md)',
            padding: 'var(--s-xl)',
            boxShadow: 'var(--shadow-2)',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        {saving && (
          <div className="t-caption" style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--c-mute)' }}>
            Saving...
          </div>
        )}
      </div>

      <div className="t-caption" style={{ color: 'var(--c-mute)' }}>
        Based on {draft.commitCount || 0} commits and {draft.noteCount || 0} note{draft.noteCount === 1 ? '' : 's'} this week.
      </div>

      <div style={{ display: 'flex', gap: 'var(--s-sm)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--s-md)' }}>
        <button className="button-primary" style={{ borderRadius: 'var(--r-pill)' }} onClick={handleCopy}>
          {copied ? 'Copied \u2713' : 'Copy'}
        </button>
        <button className="button-secondary" style={{ borderRadius: 'var(--r-pill)' }} onClick={handleMarkPosted}>
          {markedPosted ? 'Posted \u2713' : 'Mark as posted'}
        </button>
        <button 
          className="button-secondary" 
          style={{ borderRadius: 'var(--r-pill)', color: 'var(--c-mute)', border: 'none', background: 'transparent' }} 
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          {regenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>
    </div>
  );
};
