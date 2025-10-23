// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#080B12',
          800: '#0F1720',
          700: '#162231',
        },
        mint: {
          300: '#6BF5D0',
          400: '#49F0C0',
          500: '#31EFB8',
          600: '#1CD39F',
        },
        graphite: {
          100: '#E5E7EB',
          200: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          700: '#334155',
        },
      },
      fontFamily: {
        display: ['"Gota"', '"Work Sans"', 'system-ui'],
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 16px 40px rgba(12, 20, 32, 0.35)',
        pop: '0 32px 64px rgba(12, 20, 32, 0.45)',
      },
      borderRadius: { lg: '16px', '2xl': '24px', '3xl': '32px' },
    },
  },
  plugins: [],
} satisfies Config;
