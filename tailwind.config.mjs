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
        'gradient-hero':
          'linear-gradient(to bottom right, var(--color-navy-900), var(--color-navy-800), var(--color-turquoise-900))',
        'gradient-cta':
          'linear-gradient(to bottom right, var(--color-turquoise-500), var(--color-turquoise-600), var(--color-blue-600))',
        'gradient-settings':
          'linear-gradient(to bottom right, var(--color-navy-50), var(--color-slate-50), var(--color-turquoise-50))',
        'gradient-offer':
          'linear-gradient(to bottom right, var(--color-slate-50), var(--color-white), var(--color-slate-100))',
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
      fontSize: {
        // Typography scale tokens - use these instead of arbitrary sizes
        display: ['4rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        h1: ['3.5rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        h2: ['2.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        h3: ['2rem', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.005em' }],
        h4: ['1.5rem', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '0' }],
        h5: ['1.25rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0' }],
        h6: ['1.125rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0' }],
        'body-large': ['1.125rem', { lineHeight: '1.6', fontWeight: '400', letterSpacing: '0' }],
        body: ['1rem', { lineHeight: '1.6', fontWeight: '400', letterSpacing: '0' }],
        'body-small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0' }],
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.01em' }],
        'ui-large': ['1.125rem', { lineHeight: '1.5', fontWeight: '600', letterSpacing: '0' }],
        ui: ['1rem', { lineHeight: '1.5', fontWeight: '600', letterSpacing: '0' }],
        'ui-small': ['0.875rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0' }],
      },
      lineHeight: {
        // Typography system line heights
        'typography-tight': '1.2',
        'typography-snug': '1.3',
        'typography-normal': '1.5',
        'typography-relaxed': '1.6',
        'typography-loose': '1.8',
      },
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
