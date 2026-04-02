import path from 'path'
import { test, expect, goTo, ensureScreenshotDir, confirmDialog } from '../fixtures/electron'

const UNIQUE_NAME = `Operador Playwright 03 ${Date.now()}`

test.describe.serial('Operators — Automated', () => {
  test('create operator', async ({ page }) => {
    await goTo(page, '#/operators/new')
    await page.waitForSelector('#name')

    await page.fill('#name', UNIQUE_NAME)
    await page.fill('#phone', '(11) 99999-0003')
    await page.fill('#role', 'Motorista')

    await page.click('button[type="submit"]')
    await page.waitForSelector('table')

    await expect(page.locator('tr', { hasText: UNIQUE_NAME })).toBeVisible()
  })

  test('list shows created operator', async ({ page }) => {
    await goTo(page, '#/operators')
    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_NAME })).toBeVisible()
  })

  test('edit operator', async ({ page }) => {
    await goTo(page, '#/operators')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_NAME })
    await row.locator('button').nth(1).click()

    await page.waitForSelector('#name')
    await page.fill('#name', UNIQUE_NAME + ' Editado')
    await page.click('button[type="submit"]')

    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_NAME + ' Editado' })).toBeVisible()
  })

  test('delete operator', async ({ page }) => {
    await goTo(page, '#/operators')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_NAME + ' Editado' })
    await row.locator('button').last().click()
    await confirmDialog(page)

    const deletedRow = page.locator('tr', { hasText: UNIQUE_NAME + ' Editado' })
    await expect(deletedRow).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Operators — Screenshots', () => {
  test('screenshot: list page', async ({ page }) => {
    const dir = ensureScreenshotDir('operators')
    await goTo(page, '#/operators')
    await page.waitForSelector('table, [class*="empty"]', { timeout: 5000 })
    await page.screenshot({ path: path.join(dir, 'list.png'), fullPage: true })
  })

  test('screenshot: create form', async ({ page }) => {
    const dir = ensureScreenshotDir('operators')
    await goTo(page, '#/operators/new')
    await page.waitForSelector('#name')
    await page.screenshot({ path: path.join(dir, 'create-form.png'), fullPage: true })
  })
})
