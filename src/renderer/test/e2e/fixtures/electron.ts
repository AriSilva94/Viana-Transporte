// src/renderer/test/e2e/fixtures/electron.ts
import { test as base, expect } from '@playwright/test'
import { _electron as electron, ElectronApplication, Page } from 'playwright'
import path from 'path'
import fs from 'fs'

// ─── Types ───────────────────────────────────────────────────────────────────

type Fixtures = {
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
  const client = await page.evaluate(async () => {
    return (window as any).api.clients.create({
      name: '__Seed Cliente__',
      document: null,
      phone: null,
      email: null,
      notes: null,
    })
  })

  const project = await page.evaluate(async (clientId: number) => {
    return (window as any).api.projects.create({
      clientId,
      name: '__Seed Projeto__',
      location: null,
      startDate: new Date('2026-01-01'),
      endDate: null,
      status: 'active',
      contractAmount: null,
      description: null,
    })
  }, client.id)

  return { clientId: client.id, projectId: project.id }
}

// ─── Helper: seed a machine ───────────────────────────────────────────────────

export async function seedMachine(page: Page): Promise<number> {
  const machine = await page.evaluate(async () => {
    return (window as any).api.machines.create({
      name: '__Seed Máquina__',
      type: 'Escavadeira',
      identifier: null,
      brandModel: null,
      status: 'available',
      notes: null,
    })
  })
  return machine.id
}

// ─── Helper: seed an operator ─────────────────────────────────────────────────

export async function seedOperator(page: Page): Promise<number> {
  const operator = await page.evaluate(async () => {
    return (window as any).api.operators.create({
      name: '__Seed Operador__',
      phone: null,
      role: null,
      isActive: true,
      notes: null,
    })
  })
  return operator.id
}

// ─── Helper: click confirm in ConfirmDialog ───────────────────────────────────

export async function confirmDialog(page: Page): Promise<void> {
  const confirmBtn = page.locator('[data-testid="confirm-button"]')
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 })
  await confirmBtn.click()
}

// ─── Fixture ──────────────────────────────────────────────────────────────────

export const test = base.extend<Fixtures>({
  electronApp: async ({}, use) => {
    const appPath = path.join(process.cwd(), 'out/main/index.js')
    const app = await electron.launch({ args: [appPath] })
    await use(app)
    await app.close()
  },

  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => typeof (window as any).api !== 'undefined')
    await use(page)
  },
})

export { expect }
