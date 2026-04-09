import path from 'path'
import { test, expect, goTo, ensureScreenshotDir, confirmDialog } from '../fixtures/electron'

const UNIQUE_NAME = `Máquina Playwright 02 ${Date.now()}`

test.describe.serial('Machines — Automated', () => {
  test('create machine', async ({ page }) => {
    await goTo(page, '#/machines/new')
    await page.waitForSelector('#name')

    await page.fill('#name', UNIQUE_NAME)
    await page.fill('#type', 'Escavadeira')
    await page.fill('#identifier', 'PW-02')
    await page.fill('#brandModel', 'Caterpillar 320')

    await page.click('button[type="submit"]')
    await page.waitForSelector('table')

    await expect(page.locator('tr', { hasText: UNIQUE_NAME })).toBeVisible()
  })

  test('list shows created machine', async ({ page }) => {
    await goTo(page, '#/machines')
    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_NAME })).toBeVisible()
  })

  test('edit machine', async ({ page }) => {
    await goTo(page, '#/machines')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_NAME })
    await row.locator('button').nth(1).click()

    await page.waitForSelector('#name')
    await page.fill('#name', UNIQUE_NAME + ' Editada')
    await page.click('button[type="submit"]')

    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_NAME + ' Editada' })).toBeVisible()
  })

  test('delete machine', async ({ page }) => {
    await goTo(page, '#/machines')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_NAME + ' Editada' })
    await row.locator('button').last().click()
    await confirmDialog(page)

    const deletedRow = page.locator('tr', { hasText: UNIQUE_NAME + ' Editada' })
    await expect(deletedRow).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Machines — Screenshots', () => {
  test('screenshot: list page', async ({ page }) => {
    const dir = ensureScreenshotDir('machines')
    await goTo(page, '#/machines')
    await page.waitForSelector('table, [class*="empty"]', { timeout: 5000 })
    await page.screenshot({ path: path.join(dir, 'list.png'), fullPage: true })
  })

  test('screenshot: create form', async ({ page }) => {
    const dir = ensureScreenshotDir('machines')
    await goTo(page, '#/machines/new')
    await page.waitForSelector('#name')
    await page.screenshot({ path: path.join(dir, 'create-form.png'), fullPage: true })
  })
})
