// clients.spec.ts — CRUD completo + filtro de clientes contra API real
import { test, expect, goTo, uniqueSuffix } from '../fixtures/electron'

test.describe.serial('Clients', () => {
  const suffix = uniqueSuffix()
  const clientName = `E2E Cliente ${suffix}`
  const clientNameEdited = `E2E Cliente Editado ${suffix}`

  test('cria um cliente novo', async ({ page }) => {
    await goTo(page, '#/clients', 'button')
    await page.getByRole('button', { name: /novo|new/i }).click()

    await page.locator('#name').fill(clientName)
    await page.locator('#document').fill('12.345.678/0001-99')
    await page.locator('#phone').fill('(11) 99999-0001')
    await page.locator('#email').fill(`e2e-client-${suffix}@viana.local`)

    await page.getByRole('button', { name: /salvar|save/i }).click()

    await page.waitForFunction(() => window.location.hash === '#/clients')
    await page.locator('[data-testid="datatable-search"]').waitFor({ state: 'visible', timeout: 15000 })
    await page.locator('[data-testid="datatable-search"]').fill(clientName)
    await expect(page.locator(`tr:has-text("${clientName}")`)).toBeVisible({ timeout: 15000 })
  })

  test('filtra clientes por nome', async ({ page }) => {
    await goTo(page, '#/clients', '[data-testid="datatable-search"]')

    await page.locator('[data-testid="datatable-search"]').fill(clientName)

    await expect(page.locator(`tr:has-text("${clientName}")`)).toBeVisible({ timeout: 8000 })
    await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 5000 })
  })

  test('edita o cliente criado', async ({ page }) => {
    await goTo(page, '#/clients', '[data-testid="datatable-search"]')

    await page.locator('[data-testid="datatable-search"]').fill(clientName)
    const row = page.locator(`tr:has-text("${clientName}")`)
    await row.getByRole('button', { name: /editar|edit/i }).click()

    await page.locator('#name').fill(clientNameEdited)
    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${clientNameEdited}")`)).toBeVisible({ timeout: 8000 })
  })

  test('exclui o cliente', async ({ page }) => {
    await goTo(page, '#/clients', '[data-testid="datatable-search"]')

    await page.locator('[data-testid="datatable-search"]').fill(clientNameEdited)

    const row = page.locator(`tr:has-text("${clientNameEdited}")`)
    await row.getByRole('button', { name: /excluir|delete/i }).click()

    await page.locator('[data-testid="confirm-button"]').click()

    await expect(page.locator(`tr:has-text("${clientNameEdited}")`)).toHaveCount(0, { timeout: 8000 })
  })
})
