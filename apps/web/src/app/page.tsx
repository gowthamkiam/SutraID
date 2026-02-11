export default function HomePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        🔐 SutraID
      </h1>
      <p style={{ fontSize: '1.5rem', color: '#666', marginBottom: '2rem' }}>
        AI-Native CIAM Platform
      </p>
      <div style={{
        background: '#f5f5f5',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '600px'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>✨ What makes us different?</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>🤖 <strong>AI-First Design</strong> - Built for humans AND AI agents</li>
          <li>💰 <strong>$0/month</strong> - Free tier for demos</li>
          <li>🔑 <strong>Passwordless Auth</strong> - Magic links & OTP</li>
          <li>🔗 <strong>Token Delegation</strong> - Agent-to-agent chains</li>
        </ul>
      </div>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <a
          href="/login"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#000',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Login
        </a>
        <a
          href="/dashboard"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#fff',
            color: '#000',
            textDecoration: 'none',
            borderRadius: '4px',
            border: '1px solid #000'
          }}
        >
          Dashboard
        </a>
      </div>
      <p style={{ marginTop: '2rem', color: '#999', fontSize: '0.9rem' }}>
        Backend: <code>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}</code>
      </p>
    </div>
  );
}
