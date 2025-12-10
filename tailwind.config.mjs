// tailwind.config.mjs
const withOpacityValue = (variable) => {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variable}) / ${opacityValue})`;
    }

    return `rgb(var(${variable}) / 1)`;
  };
};

const config = {
  content: ['./src/**/*.{ts,tsx,md,mdx}'],
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
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        turquoise: {
          50: '#e6f9f7',
          100: '#b8f0ea',
          200: '#8ae7de',
          300: '#5cded1',
          400: '#2ed5c5',
          500: '#00b8a9',
          600: '#009688',
          700: '#00796b',
          800: '#005b4f',
          900: '#003d33',
        },
        bg: withOpacityValue('--color-bg-rgb'),
        'bg-muted': withOpacityValue('--color-bg-muted-rgb'),
        fg: withOpacityValue('--color-fg-rgb'),
        'fg-muted': withOpacityValue('--color-fg-muted-rgb'),
        border: withOpacityValue('--color-border-rgb'),
        primary: withOpacityValue('--color-primary-rgb'),
        'primary-ink': withOpacityValue('--color-primary-ink-rgb'),
        accent: withOpacityValue('--color-accent-rgb'),
        success: withOpacityValue('--color-success-rgb'),
        warning: withOpacityValue('--color-warning-rgb'),
        danger: withOpacityValue('--color-danger-rgb'),
        cta: withOpacityValue('--color-cta-rgb'),
        'cta-hover': withOpacityValue('--color-cta-hover-rgb'),
        'cta-ink': withOpacityValue('--color-cta-ink-rgb'),
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
      },
      fontFamily: {
        display: [
          'var(--font-display)',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        sans: [
          'var(--font-sans)',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 2px 6px rgba(15, 23, 42, 0.08)',
        pop: '0 12px 32px rgba(15, 23, 42, 0.16)',
      },
      borderRadius: { lg: '16px', '2xl': '24px', '3xl': '32px' },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { opacity: '0.05', transform: 'scale(1)' },
          '50%': { opacity: '0.15', transform: 'scale(1.05)' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'gentle-pulse': 'gentle-pulse 3s ease-in-out infinite',
        scroll: 'scroll 30s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
