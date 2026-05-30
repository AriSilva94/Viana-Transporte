import { test, expect, goTo, seedBase } from '../fixtures/electron'

const ERR = 'p.text-destructive'

async function submitAndExpectErrors(page: import('playwright').Page): Promise<void> {
  await page.click('button[type="submit"]')
  await expect(page.locator(ERR).first()).toBeVisible({ timeout: 4000 })
}

async function fieldHasError(page: import('playwright').Page, fieldId: string): Promise<void> {
  const fieldGroup = page
    .locator(`#${fieldId}`)
    .locator('xpath=ancestor::div[contains(@class,"space-y-2")]')
  await expect(fieldGroup.locator(ERR)).toBeVisible({ timeout: 3000 })
}

async function noTopLevelError(page: import('playwright').Page): Promise<void> {
  const formChildren = page.locator('form > p.text-destructive')
  await expect(formChildren).toHaveCount(0)
}

test.describe.serial('Form Validation — Clients', () => {
  test('empty submit shows name error below field', async ({ page }) => {
    await goTo(page, '#/clients/new', '#name')
    await submitAndExpectErrors(page)
    await fieldHasError(page, 'name')
    await noTopLevelError(page)
  })

  test('filling name clears name error', async ({ page }) => {
    await goTo(page, '#/clients/new', '#name')
    await submitAndExpectErrors(page)
    await page.fill('#name', 'Cliente Válido')
    await page.click('button[type="submit"]')
    const nameGroup = page.locator('#name').locator('xpath=..')
    await expect(nameGroup.locator(ERR)).toHaveCount(0)
  })
})

test.describe.serial('Form Validation — Machines', () => {
  test('empty submit shows name and type errors below fields', async ({ page }) => {
    await goTo(page, '#/machines/new', '#name')
    await submitAndExpectErrors(page)
    await fieldHasError(page, 'name')
    const typeGroup = page.locator('#type').locator('xpath=..')
    await expect(typeGroup.locator(ERR)).toBeVisible({ timeout: 3000 })
    await noTopLevelError(page)
  })
})

test.describe.serial('Form Validation — Operators', () => {
  test('empty submit shows name error below field', async ({ page }) => {
    await goTo(page, '#/operators/new', '#name')
    await submitAndExpectErrors(page)
    await fieldHasError(page, 'name')
    await noTopLevelError(page)
  })
})

test.describe.serial('Form Validation — Projects', () => {
  test('empty submit shows name and client errors below fields', async ({ page }) => {
    await goTo(page, '#/projects/new', '#name')
    await submitAndExpectErrors(page)
    await fieldHasError(page, 'name')
    await fieldHasError(page, 'clientId')
    await noTopLevelError(page)
  })
})

test.describe.serial('Form Validation — Revenues', () => {
  test('empty submit shows project/description/amount errors below fields', async ({ page }) => {
    await goTo(page, '#/revenues/new', '#description')
    await submitAndExpectErrors(page)
    await fieldHasError(page, 'projectId')
    await fieldHasError(page, 'description')
    await fieldHasError(page, 'amount')
    await noTopLevelError(page)
  })
})

test.describe.serial('Form Validation — Costs', () => {
  test('empty submit shows project/category/description/amount errors', async ({ page }) => {
    await goTo(page, '#/costs/new', '#description')
    await submitAndExpectErrors(page)
    await fieldHasError(page, 'projectId')
    await fieldHasError(page, 'category')
    await fieldHasError(page, 'description')
    await fieldHasError(page, 'amount')
    await noTopLevelError(page)
  })
})

test.describe.serial('Form Validation — Daily Logs', () => {
  test('empty submit shows project and hoursWorked errors', async ({ page }) => {
    await goTo(page, '#/daily-logs/new', '#hoursWorked')
    await submitAndExpectErrors(page)
    await fieldHasError(page, 'projectId')
    await fieldHasError(page, 'hoursWorked')
    await noTopLevelError(page)
  })

  test('precision error: fuelQuantity with 3 decimals shows error below field', async ({ page }) => {
    await seedBase(page)
    await goTo(page, '#/daily-logs/new', '#hoursWorked')
    await page.fill('#fuelQuantity', '10.123')
    await page.click('button[type="submit"]')
    await expect(page.locator(ERR).first()).toBeVisible({ timeout: 4000 })
    await fieldHasError(page, 'fuelQuantity')
    await noTopLevelError(page)
  })

  test('precision error: km with 3 decimals shows error below field', async ({ page }) => {
    await goTo(page, '#/daily-logs/new', '#hoursWorked')
    await page.fill('#km', '100.999')
    await page.click('button[type="submit"]')
    await expect(page.locator(ERR).first()).toBeVisible({ timeout: 4000 })
    await fieldHasError(page, 'km')
    await noTopLevelError(page)
  })

  test('precision error: percentage with 3 decimals shows error below field', async ({ page }) => {
    await goTo(page, '#/daily-logs/new', '#hoursWorked')
    await page.fill('#percentage', '12.345')
    await page.click('button[type="submit"]')
    await expect(page.locator(ERR).first()).toBeVisible({ timeout: 4000 })
    await fieldHasError(page, 'percentage')
    await noTopLevelError(page)
  })

  test('precision error: toll with 3 decimals shows error below field', async ({ page }) => {
    await goTo(page, '#/daily-logs/new', '#hoursWorked')
    await page.fill('#toll', '5.678')
    await page.click('button[type="submit"]')
    await expect(page.locator(ERR).first()).toBeVisible({ timeout: 4000 })
    await fieldHasError(page, 'toll')
    await noTopLevelError(page)
  })

  test('precision error: tonnage with 5 decimals shows error below field', async ({ page }) => {
    await goTo(page, '#/daily-logs/new', '#hoursWorked')
    await page.fill('#tonnage', '1.12345')
    await page.click('button[type="submit"]')
    await expect(page.locator(ERR).first()).toBeVisible({ timeout: 4000 })
    await fieldHasError(page, 'tonnage')
    await noTopLevelError(page)
  })

  test('valid decimals (≤2 for fuelQuantity) do not show precision error', async ({ page }) => {
    await goTo(page, '#/daily-logs/new', '#hoursWorked')
    await page.fill('#fuelQuantity', '10.50')
    await page.click('button[type="submit"]')
    const fuelGroup = page
      .locator('#fuelQuantity')
      .locator('xpath=ancestor::div[contains(@class,"space-y-2")]')
    await expect(fuelGroup.locator(ERR)).toHaveCount(0)
  })
})
