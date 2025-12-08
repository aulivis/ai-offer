import localFont from 'next/font/local';
import { Inter, Space_Mono } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: true,
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

export const spaceMono = Space_Mono({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '700'],
  variable: '--font-mono',
});

// Keep display font for special use cases (e.g., hero sections)
export const gota = localFont({
  src: [
    {
      path: '../../public/fonts/Gota-Regular.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-display',
});
