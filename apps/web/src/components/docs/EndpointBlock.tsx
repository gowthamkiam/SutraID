'use client';

import { useState } from 'react';
import MethodBadge from './MethodBadge';
import ParameterTable from './ParameterTable';
import CodeBlock from './CodeBlock';
import { EndpointDefinition, Parameter } from '@/app/docs/api-data/types';

const AUTH_LABELS: Record<string, string> = {
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
  'scim-token': 'SCIM Token',
  'api-key': 'API Key',
};

export default function EndpointBlock({
  endpoint,
}: {
  endpoint: EndpointDefinition;
}) {
  const [expanded, setExpanded] = useState(true);

  const responseAsParams: Parameter[] | undefined = endpoint.responseFields?.map(
    (r) => ({
      name: r.name,
      in: 'body' as const,
      type: r.type,
      required: false,
      description: r.description,
      example: r.example,
    })
  );

  return (
    <div
      id={endpoint.id}
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        marginBottom: '2rem',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border-color)' : 'none',
          flexWrap: 'wrap',
        }}
      >
        <MethodBadge method={endpoint.method} />
        <code
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            wordBreak: 'break-all',
          }}
        >
          {endpoint.path}
        </code>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
          }}
        >
          {endpoint.title}
        </span>
        {endpoint.auth !== 'none' && (
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-badge)',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap',
            }}
          >
            {AUTH_LABELS[endpoint.auth] || endpoint.auth}
          </span>
        )}
        <span
          style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          &#9662;
        </span>
      </div>

      {/* Content */}
      {expanded && (
        <div style={{ padding: '1.5rem 1.25rem' }}>
          <p
            style={{
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '1.5rem',
              marginTop: 0,
              fontSize: '0.925rem',
            }}
          >
            {endpoint.description}
          </p>

          {/* Two-column: params left, code right */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              alignItems: 'start',
            }}
          >
            {/* Left column: parameters + response */}
            <div style={{ minWidth: 0 }}>
              {endpoint.parameters && endpoint.parameters.length > 0 && (
                <ParameterTable params={endpoint.parameters} title="Parameters" />
              )}
              {endpoint.requestBody && endpoint.requestBody.length > 0 && (
                <ParameterTable
                  params={endpoint.requestBody}
                  title="Request Body"
                />
              )}
              {responseAsParams && responseAsParams.length > 0 && (
                <ParameterTable
                  params={responseAsParams}
                  title="Response Fields"
                />
              )}

              {/* Response sample */}
              <h4
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.75rem',
                  marginTop: '1.5rem',
                  fontWeight: 600,
                }}
              >
                Response Example
              </h4>
              <pre
                style={{
                  background: '#0f1923',
                  color: '#e2e8f0',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                <code>
                  {JSON.stringify(endpoint.responseSample, null, 2)}
                </code>
              </pre>
            </div>

            {/* Right column: code samples (sticky) */}
            <div style={{ position: 'sticky', top: '5.5rem', minWidth: 0 }}>
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
                Code Examples
              </h4>
              <CodeBlock samples={endpoint.codeSamples} />
            </div>
          </div>
        </div>
      )}

      {/* Responsive: collapse to single column */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 900px) {
              #${endpoint.id} [style*="grid-template-columns"] {
                grid-template-columns: 1fr !important;
              }
              #${endpoint.id} [style*="position: sticky"] {
                position: static !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
