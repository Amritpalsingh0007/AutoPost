import React from 'react';
import type { DraftStatus } from '../types';

export const StatusBadge: React.FC<{ status: DraftStatus }> = ({ status }) => {
  const getColors = (status: DraftStatus) => {
    switch (status) {
      case 'DRAFT': return { fill: 'var(--c-warning)', text: 'var(--c-ink)' };
      case 'EDITED': return { fill: 'var(--c-link)', text: 'var(--c-on-primary)' };
      case 'POSTED': return { fill: 'var(--c-primary)', text: 'var(--c-on-primary)' };
      case 'SKIPPED': return { fill: 'var(--c-canvas-soft-2)', text: 'var(--c-mute)' };
    }
  };
  const colors = getColors(status);
  
  return (
    <span 
      className="t-caption"
      style={{
        backgroundColor: colors.fill,
        color: colors.text,
        padding: '0 var(--s-xs)',
        borderRadius: 'var(--r-full)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '20px'
      }}
    >
      {status}
    </span>
  );
};
