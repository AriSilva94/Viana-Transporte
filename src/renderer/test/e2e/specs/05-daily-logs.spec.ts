import path from 'path'
import { test, expect, goTo, ensureScreenshotDir, seedBase, seedMachine, seedOperator, confirmDialog } from '../fixtures/electron'

const UNIQUE_DESC = `Escavação Playwright 05 ${Date.now()}`

test.describe.serial('Daily Logs — Automated', () => {
  let projectId: number

  test.beforeAll(async ({ page }) => {
    const seed = await seedBase(page)
    projectId = seed.projectId
    await seedMachine(page)
    await seedOperator(page)
  })

  test('create daily log', async ({ page }) => {
    await goTo(page, '#/daily-logs/new')
    await page.waitForSelector('#hoursWorked')

    await page.selectOption('#projectId', { value: String(projectId) })
    await page.fill('#hoursWorked', '8')
    await page.fill('#workDescription', UNIQUE_DESC)
    await page.fill('#fuelQuantity', '120')

    await page.click('button[type="submit"]')
    await page.waitForSelector('table')

    await expect(page.locator('tr', { hasText: UNIQUE_DESC })).toBeVisible()
  })

  test('list shows created log', async ({ page }) => {
    await goTo(page, '#/daily-logs')
    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_DESC })).toBeVisible()
  })

  test('edit daily log', async ({ page }) => {
    await goTo(page, '#/daily-logs')
    await page.waitForSelector('table')

    // daily-logs lista tem apenas Edit + Delete (sem View). Edit = nth(0), Delete = last()
    const row = page.locator('tr', { hasText: UNIQUE_DESC })
    await row.locator('button').nth(0).click()

    await page.waitForSelector('#hoursWorked')
    await page.fill('#hoursWorked', '10')
    await page.click('button[type="submit"]')

    await page.waitForSelector('table')
    await expect(page.locator('tr', { hasText: UNIQUE_DESC })).toBeVisible()
  })

  test('delete daily log', async ({ page }) => {
    await goTo(page, '#/daily-logs')
    await page.waitForSelector('table')

    const row = page.locator('tr', { hasText: UNIQUE_DESC })
    await row.locator('button').last().click()
    await confirmDialog(page)

    const deletedRow = page.locator('tr', { hasText: UNIQUE_DESC })
    await expect(deletedRow).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Daily Logs — Screenshots', () => {
  test.beforeAll(async ({ page }) => {
    await seedBase(page)
    await seedMachine(page)
    await seedOperator(page)
  })

  test('screenshot: list page', async ({ page }) => {
    const dir = ensureScreenshotDir('daily-logs')
    await goTo(page, '#/daily-logs')
    await page.waitForSelector('table, [class*="empty"]', { timeout: 5000 })
    await page.screenshot({ path: path.join(dir, 'list.png'), fullPage: true })
  })

  test('screenshot: create form', async ({ page }) => {
    const dir = ensureScreenshotDir('daily-logs')
    await goTo(page, '#/daily-logs/new')
    await page.waitForSelector('#hoursWorked')
    await page.screenshot({ path: path.join(dir, 'create-form.png'), fullPage: true })
  })
})
