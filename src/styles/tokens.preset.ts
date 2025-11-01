// src/styles/tokens.preset.ts
export const tokens = {
  colors: {
    bg: 'var(--color-bg)',
    bgMuted: 'var(--color-bg-muted)',
    fg: 'var(--color-fg)',
    fgMuted: 'var(--color-fg-muted)',
    border: 'var(--color-border)',

    primary: 'var(--color-primary)',
    primaryInk: 'var(--color-primary-ink)',
    accent: 'var(--color-accent)',

    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    dangerInk: 'var(--color-danger-ink)',
  },
  radius: { lg: '16px', '2xl': '24px', '3xl': '32px' },
  shadow: { card: 'var(--shadow-card)', pop: 'var(--shadow-pop)' },
  gradient: { primary: 'var(--gradient-primary)' },
  font: { sans: 'var(--font-sans)', display: 'var(--font-display)', mono: 'var(--font-mono)' },
};
