// src/renderer/test/e2e/fixtures/electron.ts
import { test as base, expect } from '@playwright/test'
import { _electron as electron, ElectronApplication, Page } from 'playwright'
import path from 'path'
import fs from 'fs'

// ─── Production safety guards ────────────────────────────────────────────────
// E2E tests must NEVER touch the production Supabase backend.
// Defense in depth — three layers of validation:
//   1. process.env.E2E_ACKNOWLEDGE_BACKEND_ISOLATED === 'YES'
//   2. Built bundle exists (out/main/index.js) and is the E2E test build
//      (contains VIANA_E2E='1' baked in by electron-vite --mode test)
//   3. Built bundle does NOT contain any production Supabase host

const PRODUCTION_SUPABASE_HOSTS = ['srv1660010.hstgr.cloud']
const ACK_ENV_VAR = 'E2E_ACKNOWLEDGE_BACKEND_ISOLATED'

function formatGuardError(reason: string): string {
  return [
    '',
    '╔══════════════════════════════════════════════════════════════════╗',
    '║                  E2E TESTS BLOCKED FOR SAFETY                    ║',
    '╚══════════════════════════════════════════════════════════════════╝',
    '',
    reason,
    '',
    'HOW E2E WORKS IN THIS PROJECT:',
    '  "npm run test:e2e" builds the app in memory-only mode',
    '  ("npm run build:e2e", which is electron-vite build --mode test).',
    '  In this mode the main process uses an in-memory repository and a',
    '  memory auth service — Supabase is NEVER called. Data lives only',
    '  in the running process and disappears when the app exits.',
    '',
    'PAST INCIDENT:',
    '  Previous E2E runs (before this guard existed) injected rows into',
    '  the production database:',
    '    - clients   LIKE "__Seed Cliente__ %" or "Cliente Playwright%"',
    '    - projects  LIKE "__Seed Projeto__ %" or "Projeto Playwright%"',
    '    - machines  LIKE "__Seed Máquina__ %" or "Máquina Playwright%"',
    '    - operators LIKE "__Seed Operador__ %" or "Operador Playwright%"',
    '    - daily_logs / project_costs / project_revenues w/ "Playwright"',
    '    - emails    LIKE "playwright%@test.com"',
    '',
    'TO RUN E2E LOCALLY:',
    '  npm run test:e2e',
    '',
    '  (the script sets both VIANA_E2E=1 and',
    `   ${ACK_ENV_VAR}=YES for you and runs build:e2e first)`,
    '',
    'TO CLEAN UP HISTORIC TEST DATA STILL IN PRODUCTION:',
    '  See src/main/db/sql/e2e-cleanup/README.md',
    '',
  ].join('\n')
}

function assertE2EAcknowledged(): void {
  if (process.env[ACK_ENV_VAR] !== 'YES') {
    throw new Error(
      formatGuardError(`Missing env var ${ACK_ENV_VAR}=YES.`)
    )
  }
}

function assertBuildIsE2ETestBuild(projectRoot: string): void {
  const mainBundle = path.join(projectRoot, 'out', 'main', 'index.js')
  if (!fs.existsSync(mainBundle)) {
    throw new Error(
      formatGuardError(
        `Built bundle not found at ${mainBundle}. Run "npm run build:e2e" first.`
      )
    )
  }
  const content = fs.readFileSync(mainBundle, 'utf-8')

  for (const host of PRODUCTION_SUPABASE_HOSTS) {
    if (content.includes(host)) {
      throw new Error(
        formatGuardError(
          `Built bundle contains production host "${host}".\n` +
          `Rebuild with "npm run build:e2e" (mode=test) before running E2E.`
        )
      )
    }
  }

  // The test build hits the memory-mode branch in main/index.ts, which emits
  // a marker string. In production builds the branch is dead and the marker
  // is tree-shaken away. Absence of the marker means this is NOT a test build.
  if (!content.includes('[VIANA_E2E_MEMORY_MODE_MARKER]')) {
    throw new Error(
      formatGuardError(
        `Built bundle is NOT a memory-mode test build.\n` +
        `Run "npm run build:e2e" to produce the correct bundle.`
      )
    )
  }
}

assertE2EAcknowledged()

// ─── Types ───────────────────────────────────────────────────────────────────

type Fixtures = {
  page: Page
}

type WorkerFixtures = {
  e2eDbPath: string
  electronApp: ElectronApplication
}

// ─── Helper: navigate using HashRouter ───────────────────────────────────────

export async function goTo(page: Page, hash: string, awaitSelector?: string): Promise<void> {
  await page.evaluate((h: string) => {
    window.location.hash = h
  }, hash)
  if (awaitSelector) {
    await page.waitForSelector(awaitSelector, { state: 'visible' })
  } else {
    await page.waitForTimeout(400)
  }
}

// ─── Helper: select a value from the custom Select dropdown ──────────────────
// The app uses a custom button-based Select rendered in a portal, so Playwright's
// native page.selectOption() does not work. This helper clicks the trigger,
// waits for the listbox, and clicks the option keyed by `data-testid`.

export async function selectCustom(
  page: Page,
  triggerId: string,
  value: string | number
): Promise<void> {
  const trigger = page.locator(`#${triggerId}`)
  await trigger.waitFor({ state: 'visible' })
  await trigger.click()
  const option = page.locator(`[data-testid="select-option-${value}"]`)
  await option.waitFor({ state: 'visible', timeout: 5000 })
  // Dropdown rendered via portal at fixed coordinates can land outside the
  // playwright viewport. Trigger native click to bypass viewport guard.
  await option.evaluate((el) => (el as HTMLElement).click())
}

// ─── Helper: ensure screenshot dir exists ────────────────────────────────────

export function ensureScreenshotDir(module: string): string {
  const dir = path.join(
    __dirname,
    '../screenshots',
    module
  )
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

// ─── Helper: seed base data (client + project) ───────────────────────────────

export async function seedBase(page: Page): Promise<{ clientId: number; projectId: number }> {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const clientName = `__Seed Cliente__ ${suffix}`
  const projectName = `__Seed Projeto__ ${suffix}`
  const client = await page.evaluate(async (seedClientName: string) => {
    return (window as any).api.clients.create({
      name: seedClientName,
      document: null,
      phone: null,
      email: null,
      notes: null,
    })
  }, clientName)

  const project = await page.evaluate(async ({ seedProjectName, clientId }: { seedProjectName: string; clientId: number }) => {
    return (window as any).api.projects.create({
      clientId,
      name: seedProjectName,
      location: null,
      startDate: new Date('2026-01-01'),
      endDate: null,
      status: 'active',
      contractAmount: null,
      description: null,
    })
  }, { seedProjectName: projectName, clientId: client.id })

  return { clientId: client.id, projectId: project.id }
}

// ─── Helper: seed a machine ───────────────────────────────────────────────────

export async function seedMachine(page: Page): Promise<{ id: number; name: string }> {
  const name = `__Seed Máquina__ ${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const machine = await page.evaluate(async (machineName: string) => {
    return (window as any).api.machines.create({
      name: machineName,
      type: 'Escavadeira',
      identifier: null,
      brandModel: null,
      status: 'available',
      notes: null,
    })
  }, name)
  return { id: machine.id, name: machine.name }
}

// ─── Helper: seed an operator ─────────────────────────────────────────────────

export async function seedOperator(page: Page): Promise<{ id: number; name: string }> {
  const name = `__Seed Operador__ ${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const operator = await page.evaluate(async (operatorName: string) => {
    return (window as any).api.operators.create({
      name: operatorName,
      phone: null,
      role: null,
      isActive: true,
      notes: null,
    })
  }, name)
  return { id: operator.id, name: operator.name }
}

// ─── Helper: click confirm in ConfirmDialog ───────────────────────────────────

export async function confirmDialog(page: Page): Promise<void> {
  const confirmBtn = page.locator('[data-testid="confirm-button"]')
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 })
  await confirmBtn.click()
}

// ─── Fixture ──────────────────────────────────────────────────────────────────

export const test = base.extend<Fixtures, WorkerFixtures>({
  e2eDbPath: [
    async ({}, use) => {
      const projectRoot = process.cwd()
      const dbPath = path.join(projectRoot, 'test-results', 'e2e', 'playwright.db')
      fs.mkdirSync(path.dirname(dbPath), { recursive: true })
      if (fs.existsSync(dbPath)) {
        fs.rmSync(dbPath, { force: true })
      }

      await use(dbPath)

      if (fs.existsSync(dbPath)) {
        fs.rmSync(dbPath, { force: true })
      }
    },
    { scope: 'worker' },
  ],

  electronApp: [
    async ({ e2eDbPath: _e2eDbPath }, use) => {
      const projectRoot = process.cwd()
      assertBuildIsE2ETestBuild(projectRoot)

      const launchEnv = Object.fromEntries(
        Object.entries(process.env).filter((entry): entry is [string, string] => {
          return typeof entry[1] === 'string'
        })
      )
      delete launchEnv.ELECTRON_RUN_AS_NODE

      const app = await electron.launch({ args: ['.'], cwd: projectRoot, env: launchEnv })
      await use(app)
      await app.close()
    },
    { scope: 'worker' },
  ],

  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow({ timeout: 15000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => typeof (window as any).api !== 'undefined', null, { timeout: 15000 })
    await use(page)
  },
})

export { expect }
