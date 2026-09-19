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
        },
      },
    ],
  },
})
