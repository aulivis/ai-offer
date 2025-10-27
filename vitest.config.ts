import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/lib/consent', replacement: resolve(__dirname, './lib/consent') },
      { find: '@/lib', replacement: resolve(__dirname, './src/lib') },
      { find: '@', replacement: resolve(__dirname, './src') },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});
