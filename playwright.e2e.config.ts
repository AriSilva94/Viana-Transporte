import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: path.join(__dirname, 'src/renderer/test/e2e/specs'),
  globalSetup: path.join(__dirname, 'src/renderer/test/e2e/global-setup.ts'),
  globalTeardown: path.join(__dirname, 'src/renderer/test/e2e/global-teardown.ts'),
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1600, height: 1000 },
  },
})
