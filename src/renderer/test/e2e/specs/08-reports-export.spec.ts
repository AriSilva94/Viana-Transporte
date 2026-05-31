import path from 'path'
import { test, expect, goTo, ensureScreenshotDir, seedBase, seedMachine, seedOperator } from '../fixtures/electron'

// Single serial describe so all tests share one worker → one Electron instance.
// Splitting into two describe blocks spawns a second worker which re-runs the
// E2E build-guard check against a potentially stale bundle and crashes.
test.describe.serial('Reports Export', () => {
  let projectId: number

  test.beforeAll(async ({ page }) => {
    const seed = await seedBase(page)
    projectId = seed.projectId
    const machine = await seedMachine(page)
    const operator = await seedOperator(page)

    // seed a daily log so daily-logs and machine-usage tabs have data
    await page.evaluate(
      async ({ projectId, machineId, operatorId }: { projectId: number; machineId: number; operatorId: number }) => {
        return (window as any).api.dailylogs.create({
          projectId,
          machineId,
          operatorId,
          date: '2026-01-10',
          hoursWorked: 8,
          fuelQuantity: 50,
          workDescription: 'Playwright seed daily log',
        })
      },
      { projectId, machineId: machine.id, operatorId: operator.id }
    )

    // seed a cost so costs-by-category tab has data
    await page.evaluate(
      async ({ projectId }: { projectId: number }) => {
        return (window as any).api.costs.create({
          projectId,
          category: 'fuel',
          description: 'Playwright seed cost',
          amount: 123.45,
          date: '2026-01-10',
        })
      },
      { projectId }
    )
  })

  // ── Navigation ──────────────────────────────────────────────────────────────

  test('reports page renders with all 4 tabs', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.waitForTimeout(600)

    await expect(page.locator('button', { hasText: 'Resumo de Projetos' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Registros Diários' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Uso de Máquinas' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Custos por Categoria' })).toBeVisible()
  })

  // ── Project Summary tab ─────────────────────────────────────────────────────

  test('Project Summary tab — ExportMenu button is visible and enabled when data exists', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })

    const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
    await expect(exportBtn).toBeVisible()
    await expect(exportBtn).not.toBeDisabled()
  })

  test('Project Summary tab — clicking Exportar opens dropdown with Excel and PDF options', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })

    const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
    await exportBtn.click()

    await expect(page.locator('button', { hasText: 'Excel (.xlsx)' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'PDF (.pdf)' })).toBeVisible()

    await page.keyboard.press('Escape')
  })

  // ── Daily Logs tab ──────────────────────────────────────────────────────────

  test('Daily Logs tab — ExportMenu button is visible and enabled when data exists', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.locator('button', { hasText: 'Registros Diários' }).click()
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })

    const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
    await expect(exportBtn).toBeVisible()
    await expect(exportBtn).not.toBeDisabled()
  })

  test('Daily Logs tab — clicking Exportar opens dropdown with Excel and PDF options', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.locator('button', { hasText: 'Registros Diários' }).click()
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })

    const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
    await exportBtn.click()

    await expect(page.locator('button', { hasText: 'Excel (.xlsx)' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'PDF (.pdf)' })).toBeVisible()

    await page.keyboard.press('Escape')
  })

  // ── Machine Usage tab ───────────────────────────────────────────────────────

  test('Machine Usage tab — ExportMenu button is visible and enabled when data exists', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.locator('button', { hasText: 'Uso de Máquinas' }).click()
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })

    const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
    await expect(exportBtn).toBeVisible()
    await expect(exportBtn).not.toBeDisabled()
  })

  test('Machine Usage tab — clicking Exportar opens dropdown with Excel and PDF options', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.locator('button', { hasText: 'Uso de Máquinas' }).click()
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })

    const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
    await exportBtn.click()

    await expect(page.locator('button', { hasText: 'Excel (.xlsx)' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'PDF (.pdf)' })).toBeVisible()

    await page.keyboard.press('Escape')
  })

  // ── Costs by Category tab ───────────────────────────────────────────────────

  test('Costs by Category tab — ExportMenu button is visible and enabled when data exists', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.locator('button', { hasText: 'Custos por Categoria' }).click()
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })

    const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
    await expect(exportBtn).toBeVisible()
    await expect(exportBtn).not.toBeDisabled()
  })

  test('Costs by Category tab — clicking Exportar opens dropdown with Excel and PDF options', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.locator('button', { hasText: 'Custos por Categoria' }).click()
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })

    const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
    await exportBtn.click()

    await expect(page.locator('button', { hasText: 'Excel (.xlsx)' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'PDF (.pdf)' })).toBeVisible()

    await page.keyboard.press('Escape')
  })

  // ── Disabled state ──────────────────────────────────────────────────────────

  test('Project Summary tab — ExportMenu is disabled when filters produce zero rows', async ({ page }) => {
    await goTo(page, '#/reports')
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })

    // apply a date far in the future so no projects match
    const datePicker = page.locator('input[type="date"]').first()
    if (await datePicker.isVisible()) {
      await datePicker.fill('2099-01-01')
      await page.waitForTimeout(600)

      const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
      await expect(exportBtn).toBeDisabled()
    }
  })

  // ── Screenshots ─────────────────────────────────────────────────────────────

  test('screenshot: reports page — project summary tab', async ({ page }) => {
    const dir = ensureScreenshotDir('reports-export')
    await goTo(page, '#/reports')
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })
    await page.screenshot({ path: path.join(dir, 'project-summary.png'), fullPage: true })
  })

  test('screenshot: reports page — export dropdown open', async ({ page }) => {
    const dir = ensureScreenshotDir('reports-export')
    await goTo(page, '#/reports')
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })
    const exportBtn = page.locator('button', { hasText: /Exportar/ }).first()
    if (await exportBtn.isEnabled()) {
      await exportBtn.click()
      await page.waitForTimeout(200)
    }
    await page.screenshot({ path: path.join(dir, 'export-dropdown.png'), fullPage: true })
  })

  test('screenshot: reports page — costs by category tab', async ({ page }) => {
    const dir = ensureScreenshotDir('reports-export')
    await goTo(page, '#/reports')
    await page.locator('button', { hasText: 'Custos por Categoria' }).click()
    await page.waitForSelector('table, p.text-muted-foreground', { timeout: 8000 })
    await page.screenshot({ path: path.join(dir, 'costs-by-category.png'), fullPage: true })
  })
})
