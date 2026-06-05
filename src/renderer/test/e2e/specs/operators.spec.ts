// operators.spec.ts — CRUD completo + filtro de operadores contra API real
import { test, expect, goTo, uniqueSuffix } from '../fixtures/electron'

test.describe.serial('Operators', () => {
  const suffix = uniqueSuffix()
  const operatorName = `E2E Operador ${suffix}`
  const operatorNameEdited = `E2E Operador Editado ${suffix}`

  test('cria um operador novo', async ({ page }) => {
    await goTo(page, '#/operators', 'button')
    await page.getByRole('button', { name: /novo|new/i }).click()

    await page.locator('#name').fill(operatorName)
    await page.locator('#phone').fill('(11) 98888-0001')
    await page.locator('#role').fill('Operador de Escavadeira')
    // isActive checkbox está marcado por padrão

    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${operatorName}")`)).toBeVisible({ timeout: 8000 })
  })

  test('filtra operadores por nome', async ({ page }) => {
    await goTo(page, '#/operators', 'input[placeholder]')

    const searchInput = page.locator('input[placeholder]').first()
    await searchInput.fill(operatorName)

    await expect(page.locator(`tr:has-text("${operatorName}")`)).toBeVisible({ timeout: 8000 })
    await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 5000 })
  })

  test('edita o operador criado', async ({ page }) => {
    await goTo(page, '#/operators', 'input[placeholder]')

    const row = page.locator(`tr:has-text("${operatorName}")`)
    await row.getByRole('button', { name: /editar|edit/i }).click()

    await page.locator('#name').fill(operatorNameEdited)
    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${operatorNameEdited}")`)).toBeVisible({ timeout: 8000 })
  })

  test('exclui o operador', async ({ page }) => {
    await goTo(page, '#/operators', 'input[placeholder]')

    const searchInput = page.locator('input[placeholder]').first()
    await searchInput.fill(operatorNameEdited)

    const row = page.locator(`tr:has-text("${operatorNameEdited}")`)
    await row.getByRole('button', { name: /excluir|delete/i }).click()

    await page.locator('[data-testid="confirm-button"]').click()

    await expect(page.locator(`tr:has-text("${operatorNameEdited}")`)).toHaveCount(0, { timeout: 8000 })
  })
})
