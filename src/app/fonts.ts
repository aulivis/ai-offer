import localFont from 'next/font/local';
import { Space_Mono, Work_Sans } from 'next/font/google';

export const workSans = Work_Sans({
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
