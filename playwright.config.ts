import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: path.join(__dirname, 'src/renderer/test/e2e/specs'),
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    screenshot: 'only-on-failure',
    video: 'off',
  },
})
