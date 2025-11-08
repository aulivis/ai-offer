import type { ThemeTokens } from '../types';

export const freeMinimalTokens: ThemeTokens = {
  color: {
    primary: '#1a1a1a', // Deep black for maximum contrast
    secondary: '#f5f5f5', // Light gray for subtle backgrounds
    text: '#1a1a1a', // Dark text
    muted: '#666666', // Medium gray for secondary text
    border: '#e0e0e0', // Light border
    bg: '#ffffff', // Pure white background
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2.5rem',
  },
  typography: {
    body: "400 11pt/1.7 'Inter', 'Segoe UI', system-ui, sans-serif",
    h1: "600 2rem/1.2 'Inter', 'Segoe UI', system-ui, sans-serif",
    h2: "600 1.25rem/1.3 'Inter', 'Segoe UI', system-ui, sans-serif",
    h3: "600 1rem/1.4 'Inter', 'Segoe UI', system-ui, sans-serif",
    table: "500 10pt/1.5 'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  radius: {
    sm: '0',
    md: '0',
    lg: '0',
  },
};












