import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 600000,
    hookTimeout: 60000,
  },
})
