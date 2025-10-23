/* eslint-disable @next/next/no-page-custom-font */
// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

import { ToastProvider } from '@/components/ToastProvider';
import { SupabaseProvider } from '@/components/SupabaseProvider';

export const metadata: Metadata = {
  title: 'Propono — AI offers',
  description: 'AI-assisted, professional offers for SMEs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-night-900 font-sans text-graphite-100 antialiased">
        <SupabaseProvider>
          <ToastProvider>{children}</ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
