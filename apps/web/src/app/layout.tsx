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
        <style dangerouslySetInnerHTML={{
          __html: `
          :root, html[data-theme="light"] {
            --bg-primary: #f9fafb;
            --bg-card: #fff;
            --bg-input: #fff;
            --bg-hover: #f3f4f6;
            --bg-badge: #f3f4f6;
            --text-primary: #111827;
            --text-secondary: #6b7280;
            --text-tertiary: #9ca3af;
            --border-color: #e5e7eb;
            --border-input: #d1d5db;
            --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
            --shadow-elevated: 0 4px 6px rgba(0, 0, 0, 0.1);
            --success-bg: #d4edda;
            --success-text: #155724;
            --success-border: #c3e6cb;
            --error-bg: #f8d7da;
            --error-text: #721c24;
            --error-border: #f5c6cb;
            --btn-primary-bg: #4f46e5;
            --btn-primary-text: #fff;
            --btn-primary-hover: #4338ca;
            --btn-secondary-bg: #fff;
            --btn-secondary-text: #374151;
            --btn-secondary-border: #d1d5db;
            --accent-primary: #4f46e5;
            --accent-secondary: #7c3aed;
            --accent-light: #eef2ff;
            --accent-text: #4338ca;
            --bg-hero: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
            --bg-section-alt: #f8fafc;
            --text-on-dark: #f8fafc;
            --text-on-dark-secondary: #cbd5e1;
            --nav-bg: rgba(255, 255, 255, 0.9);
            --nav-border: rgba(0, 0, 0, 0.06);
          }
          html[data-theme="dark"] {
            --bg-primary: #081120;
            --bg-card: #0f1d33;
            --bg-input: #132742;
            --bg-hover: #19304f;
            --bg-badge: #1b3252;
            --text-primary: #e7efff;
            --text-secondary: #b0c0dd;
            --text-tertiary: #7f93b9;
            --border-color: #274267;
            --border-input: #35567f;
            --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3);
            --shadow-elevated: 0 4px 6px rgba(0, 0, 0, 0.4);
            --success-bg: #052e16;
            --success-text: #86efac;
            --success-border: #14532d;
            --error-bg: #450a0a;
            --error-text: #fca5a5;
            --error-border: #7f1d1d;
            --btn-primary-bg: #6366f1;
            --btn-primary-text: #fff;
            --btn-primary-hover: #818cf8;
            --btn-secondary-bg: #132742;
            --btn-secondary-text: #d8e4ff;
            --btn-secondary-border: #35567f;
            --accent-primary: #6366f1;
            --accent-secondary: #a78bfa;
            --accent-light: #1e1b4b;
            --accent-text: #a5b4fc;
            --bg-hero: linear-gradient(135deg, #020617 0%, #0f0a2e 50%, #1e1b4b 100%);
            --bg-section-alt: #141414;
            --text-on-dark: #f8fafc;
            --text-on-dark-secondary: #94a3b8;
            --nav-bg: rgba(15, 15, 15, 0.9);
            --nav-border: rgba(255, 255, 255, 0.06);
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          /* Smooth transitions for all theme-dependent elements */
          body *, body {
            transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                        color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                        border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                        box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          html {
            scroll-behavior: smooth;
          }
          /* accessibility-fix: issue-6 - Skip link styles */
          .skip-link {
            position: absolute;
            top: -100%;
            left: 0;
            z-index: 9999;
            padding: 1rem 2rem;
            background: var(--btn-primary-bg);
            color: var(--btn-primary-text);
            text-decoration: none;
            font-weight: 600;
            border-radius: 0 0 8px 0;
          }
          .skip-link:focus {
            top: 0;
          }
          /* accessibility-fix: issue-9 - Global focus styles */
          :focus-visible {
            outline: 2px solid var(--accent-primary);
            outline-offset: 2px;
          }
          /* /accessibility-fix */
        `}} />
      </head>
      <body>
        {/* accessibility-fix: issue-6 - Skip to main content link */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {/* /accessibility-fix */}
        {children}
      </body>
    </html>
  );
}
