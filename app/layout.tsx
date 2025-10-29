import './globals.css';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });

export const metadata: Metadata = {
  title: 'JokerPay',
  description: 'Casino digital con billetera segura y sistema provably fair impulsado por IA.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0a0f1a] text-gray-100 selection:bg-violet-500/20 selection:text-white">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 pt-6 pb-16">{children}</main>
      </body>
    </html>
  );
}
