import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Casino' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-gray-100">{children}</body>
    </html>
  );
}
