import React from 'react';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { AppShell } from '../components/AppShell';

export const NotFound: React.FC = () => {
  const { user } = useAuth();

  const content = (
    <EmptyState 
      message="That page doesn't exist." 
      action={{ label: user ? "Back to Dashboard" : "Back Home", href: user ? "/dashboard" : "/" }} 
    />
  );

  if (user) {
    return <AppShell>{content}</AppShell>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--c-canvas-soft)' }}>
      {content}
    </div>
  );
};
