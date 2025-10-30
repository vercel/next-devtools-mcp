import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Unit tests: 30s timeout (default is 5s)
    // E2E tests: Override in test file with vi.setConfig()
    testTimeout: 30000,
    hookTimeout: 10000,

    // Only run test files that match these patterns
    include: ['test/**/*.test.ts'],

    // Exclude e2e from default test runs (use npm run test:e2e)
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'test/fixtures/**/node_modules/**',
      '**/node_modules/**',
    ],
  },
})
