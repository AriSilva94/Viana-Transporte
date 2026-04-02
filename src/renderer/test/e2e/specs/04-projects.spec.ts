import path from 'path'
import { test, expect, goTo, ensureScreenshotDir, seedBase, confirmDialog } from '../fixtures/electron'

const UNIQUE_NAME = `Projeto Playwright 04 ${Date.now()}`

test.describe.serial('Projects — Automated', () => {
  let clientId: number

  test.beforeAll(async ({ page }) => {
    const seed = await seedBase(page)
    clientId = seed.clientId
  })

  test('create project', async ({ page }) => {
    await goTo(page, '#/projects/new')
    await page.waitForSelector('#name')

    await page.fill('#name', UNIQUE_NAME)
    await page.selectOption('#clientId', { value: String(clientId) })
    await page.fill('#location', 'Rodovia SP-123, km 45')

    // DatePicker: clica para abrir o calendário, clica "Hoje"
    await page.click('#startDate')
    await page.locator('.relative.z-50').waitFor()
    await page.locator('.relative.z-50 button', { hasText: /hoje|today/i }).first().click()

    await page.selectOption('#status', 'active')
    await page.fill('#contractAmount', '150000')

    await page.click('button[type="submit"]')
    await page.waitForSelector('table')

    await expect(page.locator('tr', { hasText: UNIQUE_NAME })).toBeVisible()
  })

  test('list shows created project', async ({ page }) => {
    await goTo(page, '#/projects')
    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_NAME })).toBeVisible()
  })

  test('edit project', async ({ page }) => {
    await goTo(page, '#/projects')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_NAME })
    await row.locator('button').nth(1).click()

    await page.waitForSelector('#name')
    await page.fill('#name', UNIQUE_NAME + ' Editado')
    await page.click('button[type="submit"]')

    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_NAME + ' Editado' })).toBeVisible()
  })

  test('delete project', async ({ page }) => {
    await goTo(page, '#/projects')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_NAME + ' Editado' })
    await row.locator('button').last().click()
    await confirmDialog(page)

    const deletedRow = page.locator('tr', { hasText: UNIQUE_NAME + ' Editado' })
    await expect(deletedRow).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Projects — Screenshots', () => {
  test.beforeAll(async ({ page }) => {
    await seedBase(page)
  })

  test('screenshot: list page', async ({ page }) => {
    const dir = ensureScreenshotDir('projects')
    await goTo(page, '#/projects')
    await page.waitForSelector('table, [class*="empty"]', { timeout: 5000 })
    await page.screenshot({ path: path.join(dir, 'list.png'), fullPage: true })
  })

  test('screenshot: create form', async ({ page }) => {
    const dir = ensureScreenshotDir('projects')
    await goTo(page, '#/projects/new')
    await page.waitForSelector('#name')
    await page.screenshot({ path: path.join(dir, 'create-form.png'), fullPage: true })
  })
})
