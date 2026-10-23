import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/* Component and unit tests (docs/new/frontend/testing/frontend-testing.md §1) */
export default defineConfig({
  // plugin-react and vitest bundle different vite type versions; the plugin works with both
  plugins: [react() as never],
  // the automatic JSX runtime (tsconfig keeps "preserve" for Next)
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    css: false,
  },
});
