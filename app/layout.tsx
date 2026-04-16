import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Which Is Better?',
  description:
    'A local Bradley-Terry paired comparison tool for ranking images. All ratings computed and stored in your browser.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
