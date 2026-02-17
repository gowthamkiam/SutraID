import { HttpMethod } from '@/app/docs/api-data/types';

const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string }> = {
  GET: { bg: '#d1fae5', text: '#065f46' },
  POST: { bg: '#e0e7ff', text: '#3730a3' },
  PUT: { bg: '#fef3c7', text: '#92400e' },
  DELETE: { bg: '#fee2e2', text: '#991b1b' },
  PATCH: { bg: '#ede9fe', text: '#5b21b6' },
};

export default function MethodBadge({ method }: { method: HttpMethod }) {
  const { bg, text } = METHOD_COLORS[method];
  return (
    <span
      style={{
        background: bg,
        color: text,
        padding: '3px 10px',
        borderRadius: '6px',
        fontFamily: 'var(--font-mono, monospace)',
        fontWeight: 700,
        fontSize: '0.78rem',
        letterSpacing: '0.04em',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {method}
    </span>
  );
}
