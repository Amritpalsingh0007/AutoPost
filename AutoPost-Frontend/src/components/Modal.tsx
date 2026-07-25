import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        padding: 'var(--s-xl)',
        backgroundColor: 'var(--c-canvas)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-5)',
        border: '1px solid var(--c-hairline)',
        maxWidth: '500px',
        width: '100%',
        margin: 'var(--s-md)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="t-display-sm" style={{ margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ fontSize: '24px', lineHeight: 1 }}>&times;</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
