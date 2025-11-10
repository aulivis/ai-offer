import type { ThemeTokens } from '../types';

export const premiumExecutiveTokens: ThemeTokens = {
  color: {
    primary: '#0f172a', // Deep slate blue
    secondary: '#3b82f6', // Vibrant blue accent
    text: '#0f172a', // Dark text
    muted: '#64748b', // Medium slate
    border: '#cbd5e1', // Light slate border
    bg: '#ffffff', // White background
  },
  spacing: {
    xs: '0.375rem',
    sm: '0.75rem',
    md: '1.25rem',
    lg: '2rem',
    xl: '3rem',
  },
  typography: {
    body: "400 11pt/1.75 'Inter', 'Segoe UI', system-ui, sans-serif",
    h1: "700 2.5rem/1.15 'Inter', 'Segoe UI', system-ui, sans-serif",
    h2: "600 1.5rem/1.25 'Inter', 'Segoe UI', system-ui, sans-serif",
    h3: "600 1.125rem/1.35 'Inter', 'Segoe UI', system-ui, sans-serif",
    table: "500 10pt/1.6 'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
  },
};