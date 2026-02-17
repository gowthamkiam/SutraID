import DocsNavbar from '@/components/docs/DocsNavbar';
import DocsSidebar from '@/components/docs/DocsSidebar';

export const metadata = {
  title: 'SutraID Developer Docs',
  description:
    'Complete API reference and developer guides for the SutraID CIAM platform.',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <DocsNavbar />
      <div
        style={{
          display: 'flex',
          maxWidth: '1440px',
          margin: '0 auto',
        }}
      >
        <DocsSidebar />
        <main
          id="main-content"
          style={{
            flex: 1,
            padding: '2.5rem 3rem',
            minWidth: 0,
            maxWidth: '1100px',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
