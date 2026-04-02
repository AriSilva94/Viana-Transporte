// src/renderer/test/e2e/specs/01-clients.spec.ts
import path from 'path'
import { test, expect, goTo, ensureScreenshotDir, confirmDialog } from '../fixtures/electron'

const UNIQUE_NAME = `Cliente Playwright 01 ${Date.now()}`

test.describe.serial('Clients — Automated', () => {
  test('create client', async ({ page }) => {
    await goTo(page, '#/clients/new')
    await page.waitForSelector('#name')

    await page.fill('#name', UNIQUE_NAME)
    await page.fill('#document', '12.345.678/0001-90')
    await page.fill('#phone', '(11) 99999-0001')
    await page.fill('#email', 'playwright01@test.com')
    await page.fill('#notes', 'Criado pelo Playwright')

    await page.click('button[type="submit"]')

    // Should redirect to /clients list
    await page.waitForSelector('table', { timeout: 5000 })

    const row = page.locator('tr', { hasText: UNIQUE_NAME })
    await expect(row).toBeVisible()
  })

  test('list shows created client', async ({ page }) => {
    await goTo(page, '#/clients')
    await page.waitForSelector('table', { timeout: 5000 })

    const row = page.locator('tr', { hasText: UNIQUE_NAME })
    await expect(row).toBeVisible()
  })

  test('edit client', async ({ page }) => {
    await goTo(page, '#/clients')
    await page.waitForSelector('table')

    // Click Edit on the row with UNIQUE_NAME
    const row = page.locator('tr', { hasText: UNIQUE_NAME })
    await row.locator('button').nth(1).click() // 0=View, 1=Edit, 2=Delete

    await page.waitForSelector('#name')
    await page.fill('#name', UNIQUE_NAME + ' Editado')
    await page.click('button[type="submit"]')

    await page.waitForSelector('table')
    const updatedRow = page.locator('tr', { hasText: UNIQUE_NAME + ' Editado' })
    await expect(updatedRow).toBeVisible()
  })

  test('delete client', async ({ page }) => {
    await goTo(page, '#/clients')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_NAME + ' Editado' })
    await row.locator('button').last().click() // last = Delete

    await confirmDialog(page)

    const deletedRow = page.locator('tr', { hasText: UNIQUE_NAME + ' Editado' })
    await expect(deletedRow).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Clients — Screenshots', () => {
  test('screenshot: list page', async ({ page }) => {
    const dir = ensureScreenshotDir('clients')
    await goTo(page, '#/clients')
    await page.waitForSelector('table, [class*="empty"]', { timeout: 5000 })
    await page.screenshot({ path: path.join(dir, 'list.png'), fullPage: true })
  })

  test('screenshot: create form', async ({ page }) => {
    const dir = ensureScreenshotDir('clients')
    await goTo(page, '#/clients/new')
    await page.waitForSelector('#name')
    await page.screenshot({ path: path.join(dir, 'create-form.png'), fullPage: true })
  })
})
