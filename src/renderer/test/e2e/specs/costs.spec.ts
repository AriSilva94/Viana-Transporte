// costs.spec.ts — CRUD completo de custos de projeto contra API real
// Costs list NÃO tem campo de busca por texto — filtragem via Select customizado
// (projeto/categoria) e DatePicker. O spec cria dado único e valida diretamente na tabela.
import { test, expect, goTo, selectCustom, uniqueSuffix } from '../fixtures/electron'
import { e2eApi } from '../fixtures/api'

test.describe.serial('Costs', () => {
  const suffix = uniqueSuffix()
  const clientName = `E2E Cliente Cost ${suffix}`
  const projectName = `E2E Projeto Cost ${suffix}`
  const costDesc = `E2E Custo ${suffix}`
  const costDescEdited = `E2E Custo Editado ${suffix}`
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
      const costs = await e2eApi.listCosts({ projectId })
      for (const cost of costs) {
        await e2eApi.deleteCost(cost.id)
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

  test('cria um custo novo', async ({ page }) => {
    await goTo(page, '#/costs', 'button')
    await page.getByRole('button', { name: /novo|new/i }).click()

    // date já tem default = hoje
    await selectCustom(page, 'projectId', projectId)
    await selectCustom(page, 'category', 'fuel')
    await page.locator('#description').fill(costDesc)
    await page.locator('#amount').fill('150.00')

    await page.getByRole('button', { name: /salvar|save/i }).click()

    // A lista não tem busca por texto — valida presença direta na tabela
    await expect(page.locator(`tr:has-text("${costDesc}")`)).toBeVisible({ timeout: 8000 })
  })

  test('verifica que o custo criado aparece na listagem', async ({ page }) => {
    // Costs list não tem campo de busca — navega e confirma que a linha existe
    await goTo(page, '#/costs', 'table, [data-testid="empty-state"]')
    await expect(page.locator(`tr:has-text("${costDesc}")`)).toBeVisible({ timeout: 8000 })
  })

  test('edita o custo criado', async ({ page }) => {
    await goTo(page, '#/costs', 'table, [data-testid="empty-state"]')

    const row = page.locator(`tr:has-text("${costDesc}")`)
    await row.getByRole('button', { name: /editar|edit/i }).click()

    await page.locator('#description').fill(costDescEdited)
    await page.locator('#amount').fill('200.00')
    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${costDescEdited}")`)).toBeVisible({ timeout: 8000 })
  })

  test('exclui o custo', async ({ page }) => {
    await goTo(page, '#/costs', 'table, [data-testid="empty-state"]')

    const row = page.locator(`tr:has-text("${costDescEdited}")`)
    await row.getByRole('button', { name: /excluir|delete/i }).click()
    await page.locator('[data-testid="confirm-button"]').click()

    await expect(page.locator(`tr:has-text("${costDescEdited}")`)).toHaveCount(0, { timeout: 8000 })
  })
})
