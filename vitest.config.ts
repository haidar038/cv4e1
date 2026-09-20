import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
          exclude: ['src/**/*.dom.test.tsx'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'jsdom',
          include: ['src/**/*.dom.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['src/test/setup.dom.ts'],
          // Measured: ~60% of this project's wall-clock is module import, and
          // every file re-imports the same heavy client packages (React, base-ui,
          // axe-core, Dexie, ...). Pre-bundling them once per run keeps the test
          // count and assertions identical while cutting that cost.
          // See docs/07-quality/test-strategy.md §parallelism and wall-clock.
          deps: {
            optimizer: {
              client: {
                enabled: true,
                include: [
                  '@base-ui/react',
                  '@phosphor-icons/react',
                  '@testing-library/jest-dom/vitest',
                  '@testing-library/react',
                  '@testing-library/user-event',
                  'axe-core',
                  'dexie',
                  'fake-indexeddb',
                  'react',
                  'react-dom',
                  'react-dom/client',
                  'zustand',
                ],
              },
            },
          },
        },
      },
    ],
  },
})
