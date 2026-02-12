export default function LoginLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      padding: '2rem',
      background: 'linear-gradient(160deg, #0a1628 0%, #0f2035 25%, #0d2847 50%, #0a2a3c 75%, #0e1f2f 100%)',
    }}>
      {/* Card skeleton */}
      <div style={{
        background: '#ffffff',
        padding: '3rem 2.5rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Logo placeholder */}
        <div style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          color: '#111827',
          marginBottom: '0.75rem',
        }}>
          <span style={{ color: '#4f46e5' }}>S</span>utra
          <span style={{ color: '#4f46e5' }}>ID</span>
        </div>

        {/* Spinner */}
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #4f46e5',
          borderRadius: '50%',
          margin: '2rem auto',
          animation: 'spin 0.8s linear infinite',
        }} />

        <p style={{
          color: '#6b7280',
          fontSize: '0.95rem',
          fontWeight: 500,
          margin: 0,
        }}>
          Loading...
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
