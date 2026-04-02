// src/renderer/test/e2e/fixtures/electron.ts
import { test as base, expect } from '@playwright/test'
import { _electron as electron, ElectronApplication, Page } from 'playwright'
import path from 'path'
import fs from 'fs'

// ─── Types ───────────────────────────────────────────────────────────────────

type Fixtures = {
  e2eDbPath: string
  electronApp: ElectronApplication
  page: Page
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

export const test = base.extend<Fixtures>({
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

  electronApp: async ({ e2eDbPath }, use) => {
    const projectRoot = process.cwd()
    const launchEnv = Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => {
        return typeof entry[1] === 'string'
      })
    )
    delete launchEnv.ELECTRON_RUN_AS_NODE
    launchEnv.MIGHTYREPT_DB_PATH = e2eDbPath
    launchEnv.MIGHTYREPT_SKIP_INITIAL_SEED = '1'

    const app = await electron.launch({ args: ['.'], cwd: projectRoot, env: launchEnv })
    await use(app)
    await app.close()
  },

  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow({ timeout: 15000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => typeof (window as any).api !== 'undefined', null, { timeout: 15000 })
    await use(page)
  },
})

export { expect }
