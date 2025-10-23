import './globals.css';
import type { Metadata } from 'next';

import { ToastProvider } from '@/components/ToastProvider';
import { SupabaseProvider } from '@/components/SupabaseProvider';

import { gota, inter, spaceMono } from './fonts';

export const metadata: Metadata = {
  title: 'Propono — AI offers',
  description: 'AI-assisted, professional offers for SMEs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${inter.variable} ${gota.variable} ${spaceMono.variable}`}>
      <body className="bg-bg font-sans text-fg antialiased">
        <SupabaseProvider>
          <ToastProvider>{children}</ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
