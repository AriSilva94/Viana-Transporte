// revenues.spec.ts — CRUD completo de receitas de projeto contra API real
// Revenues list NÃO tem campo de busca por texto — filtragem via Select customizado
// (projeto/status) e DatePicker. O spec valida diretamente na tabela.
import { test, expect, goTo, selectCustom, uniqueSuffix } from '../fixtures/electron'
import { e2eApi } from '../fixtures/api'

test.describe.serial('Revenues', () => {
  const suffix = uniqueSuffix()
  const clientName = `E2E Cliente Rev ${suffix}`
  const projectName = `E2E Projeto Rev ${suffix}`
  const revenueDesc = `E2E Receita ${suffix}`
  const revenueDescEdited = `E2E Receita Editada ${suffix}`
  let clientId = 0
  let projectId = 0

  test.beforeAll(async () => {
    const client = await e2eApi.createClient({
      name: clientName,
      document: null,
      phone: null,
      email: null,
      notes: null,
    })
    clientId = client.id

    const project = await e2eApi.createProject({
      clientId,
      name: projectName,
      location: 'E2E',
      startDate: null,
      endDate: null,
      status: 'active',
      contractAmount: null,
      description: null,
    })
    projectId = project.id
  })

  test.afterAll(async () => {
    try {
      const revenues = await e2eApi.listRevenues({ projectId })
      for (const revenue of revenues) {
        await e2eApi.deleteRevenue(revenue.id)
      }
    } catch {}

    for (const remove of [
      () => projectId && e2eApi.deleteProject(projectId),
      () => clientId && e2eApi.deleteClient(clientId),
    ]) {
      try {
        await remove()
      } catch {}
    }
  })

  test('cria uma receita nova', async ({ page }) => {
    await goTo(page, '#/revenues', 'button')
    await page.getByRole('button', { name: /novo|new/i }).click()

    // date já tem default = hoje
    await selectCustom(page, 'projectId', projectId)
    await page.locator('#description').fill(revenueDesc)
    await page.locator('#amount').fill('5000.00')
    // status padrão = planned

    await page.getByRole('button', { name: /salvar|save/i }).click()

    // A lista não tem busca por texto — valida presença direta na tabela
    await expect(page.locator(`tr:has-text("${revenueDesc}")`)).toBeVisible({ timeout: 8000 })
  })

  test('verifica que a receita aparece na listagem', async ({ page }) => {
    // Revenues list não tem campo de busca — navega e confirma que a linha existe
    await goTo(page, '#/revenues', 'table, [data-testid="empty-state"]')
    await expect(page.locator(`tr:has-text("${revenueDesc}")`)).toBeVisible({ timeout: 8000 })
  })

  test('edita a receita criada', async ({ page }) => {
    await goTo(page, '#/revenues', 'table, [data-testid="empty-state"]')

    const row = page.locator(`tr:has-text("${revenueDesc}")`)
    await row.getByRole('button', { name: /editar|edit/i }).click()

    await page.locator('#description').fill(revenueDescEdited)
    await page.locator('#amount').fill('6000.00')
    // Edita o status via Select customizado
    await selectCustom(page, 'status', 'billed')
    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${revenueDescEdited}")`)).toBeVisible({ timeout: 8000 })
  })

  test('exclui a receita', async ({ page }) => {
    await goTo(page, '#/revenues', 'table, [data-testid="empty-state"]')

    const row = page.locator(`tr:has-text("${revenueDescEdited}")`)
    await row.getByRole('button', { name: /excluir|delete/i }).click()
    await page.locator('[data-testid="confirm-button"]').click()

    await expect(page.locator(`tr:has-text("${revenueDescEdited}")`)).toHaveCount(0, { timeout: 8000 })
  })
})
