// src/renderer/test/e2e/fixtures/electron.ts
//
// Fixture for e2e tests against the real NestJS API (API mode, NOT memory mode).
// The `page` fixture launches Electron with an authenticated session file created
// from the e2e API helper. Only auth.spec uses the unauthenticated page fixture
// to exercise login/logout through the UI.

import { test as base, expect } from '@playwright/test'
import { _electron as electron, ElectronApplication, Page } from 'playwright'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { getAuthStateFilePath } from '../../../../shared/auth-paths'
import { e2eApi } from './api'

// ─── Security guard ───────────────────────────────────────────────────────────
// Refuse to run if VIANA_API_BASE_URL is not pointed at localhost/127.0.0.1.
// This prevents accidentally hammering a shared or production backend.

function assertLocalhostOnly(): void {
  const baseUrl = process.env.VIANA_API_BASE_URL ?? ''
  const isLocal =
    baseUrl.startsWith('http://localhost') ||
    baseUrl.startsWith('http://127.0.0.1') ||
    baseUrl === '' // not yet set — guard is permissive for env-less runs; build-time bake handles this

  if (!isLocal) {
    throw new Error(
      [
        '',
        '╔══════════════════════════════════════════════════════════════════╗',
        '║              E2E TESTS BLOCKED — SAFETY GUARD                    ║',
        '╚══════════════════════════════════════════════════════════════════╝',
        '',
        `VIANA_API_BASE_URL is set to a non-localhost URL: "${baseUrl}"`,
        '',
        'E2E tests may only run against localhost (http://localhost:... or',
        'http://127.0.0.1:...) to prevent hitting shared or production APIs.',
        '',
        'Use "npm run test:e2e:api" — it builds with .env.e2e which points',
        'to http://localhost:3000/api and the global-setup starts a local API.',
        '',
      ].join('\n')
    )
  }
}

assertLocalhostOnly()

function createLaunchEnv(userDataDir: string): Record<string, string> {
  const launchEnv = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => {
      return typeof entry[1] === 'string'
    })
  )
  delete launchEnv.ELECTRON_RUN_AS_NODE
  launchEnv.VIANA_E2E_USER_DATA_DIR = userDataDir
  return launchEnv
}

async function assertAppUserDataDir(app: ElectronApplication, expectedUserDataDir: string): Promise<void> {
  const actualUserDataDir = await app.evaluate(({ app: electronApp }) => electronApp.getPath('userData'))
  if (actualUserDataDir !== expectedUserDataDir) {
    throw new Error(
      `Electron userData mismatch. Expected "${expectedUserDataDir}", got "${actualUserDataDir}".`
    )
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Fixtures = {
  /** Fresh Electron app per test with an isolated userData dir (no session bleed). */
  electronApp: ElectronApplication
  /** Fresh Electron app per test launched with an authenticated desktop session. */
  authenticatedElectronApp: ElectronApplication
  /** Already authenticated on the home screen. */
  page: Page
  /** App launched but NOT logged in — lands on the auth screen. */
  unauthenticatedPage: Page
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Navigate using the app's HashRouter.
 * Pass `awaitSelector` to wait for a specific element to become visible,
 * or omit it to wait a short fixed delay.
 */
export async function goTo(page: Page, hash: string, awaitSelector?: string): Promise<void> {
  await page.evaluate((h: string) => {
    window.location.hash = h
  }, hash)

  if (hash !== '#/') {
    await page.waitForFunction((h: string) => window.location.hash === h, hash)
  }
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))

  const authInput = page.locator('[data-testid="auth-input-email"]')
  if (await authInput.isVisible().catch(() => false)) {
    throw new Error(`Navigation to ${hash} returned to the auth screen`)
  }

  if (awaitSelector) {
    await Promise.race([
      page.waitForSelector(awaitSelector, { state: 'visible' }),
      authInput.waitFor({ state: 'visible' }).then(() => {
        throw new Error(`Navigation to ${hash} returned to the auth screen`)
      }),
    ])
  } else {
    await page.waitForTimeout(400)
  }

  if (await authInput.isVisible().catch(() => false)) {
    throw new Error(`Navigation to ${hash} returned to the auth screen`)
  }
}

/**
 * Select a value from the app's custom portal-based Select component.
 * Playwright's native `page.selectOption()` does not work because the dropdown
 * is rendered via a portal outside the trigger element.
 */
export async function selectCustom(
  page: Page,
  triggerId: string,
  value: string | number
): Promise<void> {
  const trigger = page.locator(`#${triggerId}`)
  await trigger.waitFor({ state: 'visible' })
  await trigger.click()
  const option = page.locator(`[data-testid="select-option-${value}"]`)
  await option.waitFor({ state: 'visible', timeout: 10000 })
  // The dropdown can be rendered outside the Playwright viewport via a portal.
  // Use evaluate to trigger the native click and bypass the viewport guard.
  await option.evaluate((el) => (el as HTMLElement).click())
}

/**
 * Click the confirm button inside a ConfirmDialog.
 */
export async function confirmDialog(page: Page): Promise<void> {
  const confirmBtn = page.locator('[data-testid="confirm-button"]')
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 })
  await confirmBtn.click()
}

/**
 * Generate a short unique suffix for test data names so concurrent/sequential
 * runs do not collide. Format: `<timestamp>-<random4digits>`.
 */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

// ─── Fixture ──────────────────────────────────────────────────────────────────

export const test = base.extend<Fixtures>({
  electronApp: [
    async ({}, use) => {
      const projectRoot = process.cwd()
      const mainBundle = path.join(projectRoot, 'out', 'main', 'index.js')

      if (!fs.existsSync(mainBundle)) {
        throw new Error(
          `Built bundle not found at ${mainBundle}.\n` +
          'Run "npm run build:e2e:api" first.'
        )
      }

      // Verify this is an API-mode build (must NOT contain the memory-mode marker).
      const bundleContent = fs.readFileSync(mainBundle, 'utf-8')
      if (bundleContent.includes('[VIANA_E2E_MEMORY_MODE_MARKER]')) {
        throw new Error(
          'Built bundle is a memory-mode build, not an API-mode build.\n' +
          'Run "npm run build:e2e:api" (not "build:e2e") to produce the correct bundle.'
        )
      }

      // Isolated userData dir per test → no persisted session bleeds between tests.
      // Without this, the first successful login persists a session and every
      // later test boots already-authenticated, so the auth screen never appears.
      const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'viana-e2e-userdata-'))
      const launchEnv = createLaunchEnv(userDataDir)

      const app = await electron.launch({
        args: [`--user-data-dir=${userDataDir}`, '.'],
        cwd: projectRoot,
        env: launchEnv,
      })
      await assertAppUserDataDir(app, userDataDir)
      await use(app)
      await app.close()
      fs.rmSync(userDataDir, { recursive: true, force: true })
    },
    { scope: 'test' },
  ],

  authenticatedElectronApp: [
    async ({}, use) => {
      const projectRoot = process.cwd()
      const mainBundle = path.join(projectRoot, 'out', 'main', 'index.js')

      if (!fs.existsSync(mainBundle)) {
        throw new Error(
          `Built bundle not found at ${mainBundle}.\n` +
          'Run "npm run build:e2e:api" first.'
        )
      }

      const bundleContent = fs.readFileSync(mainBundle, 'utf-8')
      if (bundleContent.includes('[VIANA_E2E_MEMORY_MODE_MARKER]')) {
        throw new Error(
          'Built bundle is a memory-mode build, not an API-mode build.\n' +
          'Run "npm run build:e2e:api" (not "build:e2e") to produce the correct bundle.'
        )
      }

      const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'viana-e2e-userdata-'))
      const launchEnv = createLaunchEnv(userDataDir)
      const authState = await e2eApi.createAuthState()
      const authStateFile = getAuthStateFilePath(userDataDir)
      fs.mkdirSync(path.dirname(authStateFile), { recursive: true })
      fs.writeFileSync(authStateFile, JSON.stringify(authState, null, 2), 'utf-8')

      const app = await electron.launch({
        args: [`--user-data-dir=${userDataDir}`, '.'],
        cwd: projectRoot,
        env: launchEnv,
      })
      await assertAppUserDataDir(app, userDataDir)
      await use(app)
      await app.close()
      fs.rmSync(userDataDir, { recursive: true, force: true })
    },
    { scope: 'test' },
  ],

  page: async ({ authenticatedElectronApp }, use) => {
    const page = await authenticatedElectronApp.firstWindow({ timeout: 20000 })
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible({ timeout: 20000 })

    // Hand the already-authenticated page to the spec.
    await use(page)
  },

  // Launches the app and hands the page to the spec WITHOUT logging in.
  // The spec receives the app sitting on the auth screen.
  unauthenticatedPage: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow({ timeout: 20000 })
    await page.waitForLoadState('domcontentloaded')
    // Wait for the auth screen to be visible before handing off
    await page.waitForSelector('[data-testid="auth-input-email"]', { state: 'visible', timeout: 20000 })
    await use(page)
  },
})

export { expect }
