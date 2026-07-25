import React from 'react';
import type { WeeklyDraft } from '../types';
import { StatusBadge } from './StatusBadge';
import { Link } from 'react-router-dom';

interface DraftCardProps {
  draft: WeeklyDraft;
  onCopy: (content: string) => void;
  onMarkPosted: (id: number) => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({ draft, onCopy, onMarkPosted }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    onCopy(draft.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="card" style={{ padding: 'var(--s-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--s-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-sm)' }}>
          <h3 className="t-body-sm-strong" style={{ margin: 0 }}>{draft.repoName}</h3>
          <StatusBadge status={draft.status} />
        </div>
        <span className="t-caption-mono" style={{ color: 'var(--c-mute)' }}>{draft.weekOf}</span>
      </div>
      
      <p className="t-body-md" style={{ color: 'var(--c-body)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
        {draft.content}
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-md)', marginTop: 'var(--s-xs)' }}>
        <Link to={`/drafts/${draft.id}`} className="t-body-sm-strong" style={{ color: 'var(--c-link)' }}>Review</Link>
        <button className="button-secondary-sm" onClick={handleCopy}>
          {copied ? 'Copied \u2713' : 'Copy'}
        </button>
        {draft.status !== 'POSTED' && (
          <button className="button-primary-sm" onClick={() => onMarkPosted(draft.id)}>
            Mark as posted
          </button>
        )}
      </div>
    </div>
  );
};
