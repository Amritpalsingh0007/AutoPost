import React from 'react';
import type { WeekStatus } from '../types';

export const WeeklyGrid: React.FC<{ weeks: WeekStatus[] }> = ({ weeks }) => {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {weeks.map((w, idx) => {
        let bg = 'transparent';
        let border = '1px solid var(--c-hairline)';
        if (w.status === 'DRAFT') { bg = 'var(--c-warning)'; border = 'none'; }
        if (w.status === 'EDITED') { bg = 'var(--c-link)'; border = 'none'; }
        if (w.status === 'POSTED') { bg = 'var(--c-primary)'; border = 'none'; }
        
        return (
          <div 
            key={w.weekOf + idx}
            title={`${w.weekOf}: ${w.status}`}
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: bg,
              border: border,
              borderRadius: '2px'
            }}
          />
        );
      })}
    </div>
  );
};
