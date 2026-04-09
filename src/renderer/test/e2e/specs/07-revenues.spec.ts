import path from 'path'
import { test, expect, goTo, ensureScreenshotDir, seedBase, confirmDialog } from '../fixtures/electron'

const UNIQUE_DESC = `Medição Playwright 07 ${Date.now()}`

test.describe.serial('Revenues — Automated', () => {
  let projectId: number

  test.beforeAll(async ({ page }) => {
    const seed = await seedBase(page)
    projectId = seed.projectId
  })

  test('create revenue', async ({ page }) => {
    await goTo(page, '#/revenues/new')
    await page.waitForSelector('#description')

    await page.selectOption('#projectId', { value: String(projectId) })
    await page.fill('#description', UNIQUE_DESC)
    await page.fill('#amount', '25000.00')
    await page.selectOption('#status', 'billed')

    await page.click('button[type="submit"]')
    await page.waitForSelector('table')

    await expect(page.locator('tr', { hasText: UNIQUE_DESC })).toBeVisible()
  })

  test('list shows created revenue', async ({ page }) => {
    await goTo(page, '#/revenues')
    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_DESC })).toBeVisible()
  })

  test('edit revenue', async ({ page }) => {
    await goTo(page, '#/revenues')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_DESC })
    await row.locator('button').nth(0).click()

    await page.waitForSelector('#description')
    await page.fill('#description', UNIQUE_DESC + ' Editado')
    await page.fill('#amount', '30000.00')
    await page.selectOption('#status', 'received')
    await page.click('button[type="submit"]')

    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_DESC + ' Editado' })).toBeVisible()
  })

  test('delete revenue', async ({ page }) => {
    await goTo(page, '#/revenues')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_DESC + ' Editado' })
    await row.locator('button').last().click()
    await confirmDialog(page)

    const deletedRow = page.locator('tr', { hasText: UNIQUE_DESC + ' Editado' })
    await expect(deletedRow).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Revenues — Screenshots', () => {
  test.beforeAll(async ({ page }) => {
    await seedBase(page)
  })

  test('screenshot: list page', async ({ page }) => {
    const dir = ensureScreenshotDir('revenues')
    await goTo(page, '#/revenues')
    await page.waitForSelector('table, [class*="empty"]', { timeout: 5000 })
    await page.screenshot({ path: path.join(dir, 'list.png'), fullPage: true })
  })

  test('screenshot: create form', async ({ page }) => {
    const dir = ensureScreenshotDir('revenues')
    await goTo(page, '#/revenues/new')
    await page.waitForSelector('#description')
    await page.screenshot({ path: path.join(dir, 'create-form.png'), fullPage: true })
  })
})
