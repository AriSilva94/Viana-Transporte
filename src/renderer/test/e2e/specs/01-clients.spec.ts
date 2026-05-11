// src/renderer/test/e2e/specs/01-clients.spec.ts
import path from 'path'
import { test, expect, goTo, ensureScreenshotDir, confirmDialog } from '../fixtures/electron'

const UNIQUE_SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
const UNIQUE_NAME = `Cliente Playwright 01 ${UNIQUE_SUFFIX}`
const UNIQUE_DOC = `${Date.now()}`.slice(-14)
const UNIQUE_EMAIL = `playwright01-${UNIQUE_SUFFIX}@test.com`

test.describe.serial('Clients — Automated', () => {
  test('create client', async ({ page }) => {
    await goTo(page, '#/clients/new')
    await page.waitForSelector('#name')

    await page.fill('#name', UNIQUE_NAME)
    await page.fill('#document', UNIQUE_DOC)
    await page.fill('#phone', '(11) 99999-0001')
    await page.fill('#email', UNIQUE_EMAIL)
    await page.fill('#notes', 'Criado pelo Playwright')

    await page.click('button[type="submit"]')

    // Should redirect to /clients list
    await page.waitForSelector('table')

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
    await expect(page.locator('#name')).not.toHaveValue('')
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
