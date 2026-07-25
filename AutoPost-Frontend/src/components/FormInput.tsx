import React, { type InputHTMLAttributes } from 'react';
import { cn } from '../utils';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, className, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-xs)', width: '100%' }}>
      {label && <label className="t-body-sm-strong" style={{ color: 'var(--c-ink)' }}>{label}</label>}
      <input
        className={cn(className, 't-body-sm')}
        style={{
          backgroundColor: 'var(--c-canvas)',
          border: error ? '2px solid var(--c-error)' : '1px solid var(--c-hairline)',
          borderRadius: 'var(--r-sm)',
          padding: '0 var(--s-sm)',
          height: '40px',
          color: 'var(--c-ink)',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => {
          if (!error) e.currentTarget.style.border = '2px solid var(--c-link)';
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.border = '1px solid var(--c-hairline)';
        }}
        {...props}
      />
      {error && <span className="t-caption" style={{ color: 'var(--c-error)' }}>{error}</span>}
    </div>
  );
};
