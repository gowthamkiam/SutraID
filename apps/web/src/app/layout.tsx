import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SutraID - AI-Native Authentication',
  description: 'The only CIAM platform built for both humans AND AI agents',
};

// Inline script to apply theme before first paint to avoid flash
const themeScript = `
(function() {
  try {
    var mode = localStorage.getItem('colorMode') || 'light';
    if (mode === 'auto') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', mode);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: `
          :root, html[data-theme="light"] {
            --bg-primary: #f9fafb;
            --bg-card: #fff;
            --bg-input: #fff;
            --bg-hover: #f3f4f6;
            --bg-badge: #f3f4f6;
            --text-primary: #000;
            --text-secondary: #666;
            --text-tertiary: #999;
            --border-color: #e5e7eb;
            --border-input: #ddd;
            --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
            --shadow-elevated: 0 4px 6px rgba(0, 0, 0, 0.1);
            --success-bg: #d4edda;
            --success-text: #155724;
            --success-border: #c3e6cb;
            --error-bg: #f8d7da;
            --error-text: #721c24;
            --error-border: #f5c6cb;
            --btn-primary-bg: #000;
            --btn-primary-text: #fff;
          }
          html[data-theme="dark"] {
            --bg-primary: #0f0f0f;
            --bg-card: #1a1a1a;
            --bg-input: #252525;
            --bg-hover: #2a2a2a;
            --bg-badge: #2a2a2a;
            --text-primary: #e5e5e5;
            --text-secondary: #a3a3a3;
            --text-tertiary: #737373;
            --border-color: #2e2e2e;
            --border-input: #404040;
            --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3);
            --shadow-elevated: 0 4px 6px rgba(0, 0, 0, 0.4);
            --success-bg: #052e16;
            --success-text: #86efac;
            --success-border: #14532d;
            --error-bg: #450a0a;
            --error-text: #fca5a5;
            --error-border: #7f1d1d;
            --btn-primary-bg: #e5e5e5;
            --btn-primary-text: #0f0f0f;
          }
          body {
            margin: 0;
            background: var(--bg-primary);
            color: var(--text-primary);
            transition: background 0.2s, color 0.2s;
          }
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
