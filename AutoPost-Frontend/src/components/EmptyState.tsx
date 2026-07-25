import React from 'react';

interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, action }) => {
  return (
    <div style={{
      backgroundColor: 'var(--c-canvas-soft)',
      borderRadius: 'var(--r-lg)',
      padding: 'var(--s-3xl)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 'var(--s-lg)'
    }}>
      <p className="t-body-md" style={{ color: 'var(--c-body)', margin: 0 }}>
        {message}
      </p>
      {action && (
        action.href ? (
          <a href={action.href} className="button-primary">
            {action.label}
          </a>
        ) : (
          <button className="button-primary" onClick={action.onClick}>
            {action.label}
          </button>
        )
      )}
    </div>
  );
};
