// machines.spec.ts — CRUD completo + filtro de máquinas contra API real
import { test, expect, goTo, uniqueSuffix } from '../fixtures/electron'

test.describe.serial('Machines', () => {
  const suffix = uniqueSuffix()
  const machineName = `E2E Máquina ${suffix}`
  const machineNameEdited = `E2E Máquina Editada ${suffix}`

  test('cria uma máquina nova', async ({ page }) => {
    await goTo(page, '#/machines', 'button')
    await page.getByRole('button', { name: /novo|new/i }).click()

    await page.locator('#name').fill(machineName)
    await page.locator('#type').fill('Escavadeira')
    await page.locator('#identifier').fill(`ID-${suffix}`)
    await page.locator('#brandModel').fill('Caterpillar 320')
    // status padrão = available

    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${machineName}")`)).toBeVisible({ timeout: 8000 })
  })

  test('filtra máquinas por nome', async ({ page }) => {
    await goTo(page, '#/machines', '[data-testid="datatable-search"]')

    await page.locator('[data-testid="datatable-search"]').fill(machineName)

    await expect(page.locator(`tr:has-text("${machineName}")`)).toBeVisible({ timeout: 8000 })
    await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 5000 })
  })

  test('edita a máquina criada', async ({ page }) => {
    await goTo(page, '#/machines', '[data-testid="datatable-search"]')

    const row = page.locator(`tr:has-text("${machineName}")`)
    await row.getByRole('button', { name: /editar|edit/i }).click()

    await page.locator('#name').fill(machineNameEdited)
    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${machineNameEdited}")`)).toBeVisible({ timeout: 8000 })
  })

  test('exclui a máquina', async ({ page }) => {
    await goTo(page, '#/machines', '[data-testid="datatable-search"]')

    await page.locator('[data-testid="datatable-search"]').fill(machineNameEdited)

    const row = page.locator(`tr:has-text("${machineNameEdited}")`)
    await row.getByRole('button', { name: /excluir|delete/i }).click()

    await page.locator('[data-testid="confirm-button"]').click()

    await expect(page.locator(`tr:has-text("${machineNameEdited}")`)).toHaveCount(0, { timeout: 8000 })
  })
})
