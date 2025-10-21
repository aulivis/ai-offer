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
        ink: { 900: '#0B1220', 800: '#111827' },
        brand: {
          blue: { 500: '#3B82F6', 600: '#2563EB' },
          emerald: { 500: '#22C55E', 600: '#16A34A' },
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui'],
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(2,6,23,0.08), 0 10px 24px rgba(2,6,23,0.06)',
        pop: '0 10px 40px rgba(2,6,23,0.22)',
      },
      borderRadius: { lg: '16px', '2xl': '24px' },
    },
  },
  plugins: [],
} satisfies Config;
