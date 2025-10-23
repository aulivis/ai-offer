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
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
      },
      fontFamily: {
display: ['var(--font-display)', 'system-ui'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
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
    },
  },
  plugins: [],
};

export default config;
