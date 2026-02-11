import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SutraID - AI-Native Authentication',
  description: 'The only CIAM platform built for both humans AND AI agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
