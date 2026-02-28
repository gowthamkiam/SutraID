export default function ErrorsPage() {
  const codeStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--accent-text)',
    background: 'var(--accent-light)',
    padding: '1px 5px',
    borderRadius: '4px',
    fontSize: '0.88rem',
  };

  const errors = [
    {
      status: 400,
      title: 'Bad Request',
      description: 'The request body failed validation. Check required fields and data types.',
      resolution: 'Review the request body against the API reference. Ensure all required fields are present and correctly typed.',
    },
    {
      status: 401,
      title: 'Unauthorized',
      description: 'Missing, invalid, or expired authentication token.',
      resolution: 'Include a valid access token in the Authorization header. If expired, obtain a new token using your refresh token.',
    },
    {
      status: 403,
      title: 'Forbidden',
      description: 'The authenticated user lacks permission for this action.',
      resolution: 'Check the user\'s role. The required permission is listed in each endpoint\'s documentation.',
    },
    {
      status: 404,
      title: 'Not Found',
      description: 'The requested resource does not exist or is not accessible to the current user.',
      resolution: 'Verify the resource ID in the URL path.',
    },
    {
      status: 409,
      title: 'Conflict',
      description: 'A resource with the same unique identifier already exists.',
      resolution: 'Check for duplicate emails, slugs, or names. Use a unique value.',
    },
    {
      status: 422,
      title: 'Unprocessable Entity',
      description: 'The request was well-formed but contained semantic errors.',
      resolution: 'Review the validation error messages in the response body for specific field issues.',
    },
    {
      status: 429,
      title: 'Too Many Requests',
      description: 'Rate limit exceeded. You are sending too many requests.',
      resolution: 'Implement exponential backoff. Reduce request frequency. Check the Retry-After header for wait time.',
    },
    {
      status: 500,
      title: 'Internal Server Error',
      description: 'An unexpected error occurred on the server.',
      resolution: 'Retry the request after a brief delay. If the error persists, contact support with the request ID.',
    },
  ];

  return (
    <div style={{ maxWidth: '760px' }}>
      <h1
        style={{
          fontSize: '2.2rem',
          fontWeight: 900,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginTop: 0,
          marginBottom: '0.75rem',
        }}
      >
        Error Handling
      </h1>
      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '2rem',
        }}
      >
        SutraID uses standard HTTP status codes and returns structured JSON error
        responses. All errors follow a consistent format.
      </p>

      {/* Error response format */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Error Response Format
        </h2>
        <pre
          style={{
            background: '#0f1923',
            color: '#e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            fontSize: '0.83rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <code>{`{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}`}</code>
        </pre>
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginTop: '1rem',
          }}
        >
          Validation errors (400) include an array of specific field errors:
        </p>
        <pre
          style={{
            background: '#0f1923',
            color: '#e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            fontSize: '0.83rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <code>{`{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}`}</code>
        </pre>
      </div>

      {/* Error codes table */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          HTTP Status Codes
        </h2>
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-badge)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.6rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    width: '8%',
                  }}
                >
                  Code
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.6rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    width: '15%',
                  }}
                >
                  Title
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.6rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.6rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Resolution
                </th>
              </tr>
            </thead>
            <tbody>
              {errors.map((err, i) => (
                <tr
                  key={err.status}
                  style={{
                    borderBottom:
                      i < errors.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <td style={{ padding: '0.6rem 1rem' }}>
                    <code
                      style={{
                        ...codeStyle,
                        color: err.status >= 500 ? '#dc2626' : err.status >= 400 ? '#d97706' : 'var(--accent-text)',
                      }}
                    >
                      {err.status}
                    </code>
                  </td>
                  <td
                    style={{
                      padding: '0.6rem 1rem',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {err.title}
                  </td>
                  <td style={{ padding: '0.6rem 1rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {err.description}
                  </td>
                  <td style={{ padding: '0.6rem 1rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {err.resolution}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best practices */}
      <div>
        <h2
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Best Practices
        </h2>
        <ul
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            paddingLeft: '1.25rem',
          }}
        >
          <li>Always check the HTTP status code before parsing the response body.</li>
          <li>
            Handle <code style={codeStyle}>401</code> errors by refreshing the access
            token using your refresh token, then retrying the request.
          </li>
          <li>
            Implement exponential backoff for <code style={codeStyle}>429</code> and{' '}
            <code style={codeStyle}>500</code> errors.
          </li>
          <li>
            Log the full error response (including <code style={codeStyle}>message</code>)
            for debugging purposes.
          </li>
          <li>
            Never expose raw error messages to end users in production — map them
            to user-friendly messages.
          </li>
        </ul>
      </div>
    </div>
  );
}
