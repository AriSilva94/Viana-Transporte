import path from 'path'
import { test, expect, goTo, ensureScreenshotDir, seedBase, confirmDialog } from '../fixtures/electron'

const UNIQUE_DESC = `Combustível Playwright 06 ${Date.now()}`

test.describe.serial('Costs — Automated', () => {
  let projectId: number

  test.beforeAll(async ({ page }) => {
    const seed = await seedBase(page)
    projectId = seed.projectId
  })

  test('create cost', async ({ page }) => {
    await goTo(page, '#/costs/new')
    await page.waitForSelector('#description')

    await page.selectOption('#projectId', { value: String(projectId) })
    await page.selectOption('#category', 'fuel')
    await page.fill('#description', UNIQUE_DESC)
    await page.fill('#amount', '500.50')

    await page.click('button[type="submit"]')
    await page.waitForSelector('table')

    await expect(page.locator('tr', { hasText: UNIQUE_DESC })).toBeVisible()
  })

  test('list shows created cost', async ({ page }) => {
    await goTo(page, '#/costs')
    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_DESC })).toBeVisible()
  })

  test('edit cost', async ({ page }) => {
    await goTo(page, '#/costs')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_DESC })
    await row.locator('button').nth(1).click()

    await page.waitForSelector('#description')
    await page.fill('#description', UNIQUE_DESC + ' Editado')
    await page.fill('#amount', '600.00')
    await page.click('button[type="submit"]')

    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_DESC + ' Editado' })).toBeVisible()
  })

  test('delete cost', async ({ page }) => {
    await goTo(page, '#/costs')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_DESC + ' Editado' })
    await row.locator('button').last().click()
    await confirmDialog(page)

    const deletedRow = page.locator('tr', { hasText: UNIQUE_DESC + ' Editado' })
    await expect(deletedRow).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Costs — Screenshots', () => {
  test.beforeAll(async ({ page }) => {
    await seedBase(page)
  })

  test('screenshot: list page', async ({ page }) => {
    const dir = ensureScreenshotDir('costs')
    await goTo(page, '#/costs')
    await page.waitForSelector('table, [class*="empty"]', { timeout: 5000 })
    await page.screenshot({ path: path.join(dir, 'list.png'), fullPage: true })
  })

  test('screenshot: create form', async ({ page }) => {
    const dir = ensureScreenshotDir('costs')
    await goTo(page, '#/costs/new')
    await page.waitForSelector('#description')
    await page.screenshot({ path: path.join(dir, 'create-form.png'), fullPage: true })
  })
})
