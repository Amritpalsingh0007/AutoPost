import React from 'react';

export const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  return (
    <pre style={{
      backgroundColor: 'var(--c-primary)',
      color: 'var(--c-on-primary)',
      borderRadius: 'var(--r-md)',
      padding: 'var(--s-lg)',
      overflowX: 'auto',
      margin: 0
    }} className="t-code">
      <code>{code}</code>
    </pre>
  );
};
