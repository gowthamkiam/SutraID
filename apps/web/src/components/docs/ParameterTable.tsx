import { Parameter } from '@/app/docs/api-data/types';

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  color: 'var(--text-tertiary)',
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function ParameterTable({
  params,
  title,
}: {
  params: Parameter[];
  title: string;
}) {
  if (!params || params.length === 0) return null;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '0.75rem',
          marginTop: 0,
          fontWeight: 600,
        }}
      >
        {title}
      </h4>
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-badge)',
              }}
            >
              <th style={{ ...thStyle, width: '22%' }}>Name</th>
              <th style={{ ...thStyle, width: '14%' }}>Type</th>
              <th style={{ ...thStyle, width: '10%' }}>Required</th>
              <th style={thStyle}>Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => (
              <tr
                key={p.name}
                style={{
                  borderBottom:
                    i < params.length - 1
                      ? '1px solid var(--border-color)'
                      : 'none',
                }}
              >
                <td style={{ padding: '0.6rem 0.75rem' }}>
                  <code
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--accent-text)',
                      fontSize: '0.83rem',
                      background: 'var(--accent-light)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    {p.name}
                  </code>
                </td>
                <td
                  style={{
                    padding: '0.6rem 0.75rem',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.8rem',
                  }}
                >
                  {p.type}
                </td>
                <td style={{ padding: '0.6rem 0.75rem' }}>
                  {p.required ? (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Required
                    </span>
                  ) : (
                    <span
                      style={{
                        color: 'var(--text-tertiary)',
                        fontSize: '0.75rem',
                      }}
                    >
                      Optional
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: '0.6rem 0.75rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {p.description}
                  {p.example && (
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: '0.4rem' }}>
                      e.g.{' '}
                      <code
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.8rem',
                        }}
                      >
                        {p.example}
                      </code>
                    </span>
                  )}
                  {p.enum && (
                    <div style={{ marginTop: '0.3rem' }}>
                      {p.enum.map((v) => (
                        <code
                          key={v}
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '0.72rem',
                            background: 'var(--bg-badge)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            marginRight: '0.3rem',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
