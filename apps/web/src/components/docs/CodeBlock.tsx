'use client';

import { useState } from 'react';
import { CodeSample } from '@/app/docs/api-data/types';

type Language = keyof CodeSample;

const LANGUAGES: { key: Language; label: string }[] = [
  { key: 'curl', label: 'cURL' },
  { key: 'python', label: 'Python' },
  { key: 'nodejs', label: 'Node.js' },
  { key: 'java', label: 'Java' },
  { key: 'go', label: 'Go' },
  { key: 'php', label: 'PHP' },
];

export default function CodeBlock({ samples }: { samples: CodeSample }) {
  const [activeLanguage, setActiveLanguage] = useState<Language>('curl');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(samples[activeLanguage]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = samples[activeLanguage];
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          background: '#1a2332',
          borderBottom: '1px solid #2d3748',
          padding: '0 0.5rem',
          overflowX: 'auto',
        }}
      >
        {LANGUAGES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveLanguage(key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.6rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: activeLanguage === key ? '#93c5fd' : '#64748b',
              borderBottom:
                activeLanguage === key
                  ? '2px solid #93c5fd'
                  : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem 0.75rem',
            fontSize: '0.75rem',
            color: copied ? '#34d399' : '#64748b',
            fontWeight: 500,
            transition: 'color 0.15s',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* Code area */}
      <pre
        style={{
          margin: 0,
          padding: '1.25rem',
          background: '#0f1923',
          color: '#e2e8f0',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.83rem',
          lineHeight: 1.65,
          overflowX: 'auto',
          minHeight: '60px',
        }}
      >
        <code>{samples[activeLanguage]}</code>
      </pre>
    </div>
  );
}
