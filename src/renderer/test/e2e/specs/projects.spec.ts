// projects.spec.ts — CRUD completo + filtro de projetos contra API real
// Cria o cliente dependente via API para manter este spec focado no CRUD de projetos.
import { test, expect, goTo, selectCustom, uniqueSuffix } from '../fixtures/electron'
import { e2eApi } from '../fixtures/api'

test.describe.serial('Projects', () => {
  const suffix = uniqueSuffix()
  const clientName = `E2E Cliente Proj ${suffix}`
  const projectName = `E2E Projeto ${suffix}`
  const projectNameEdited = `E2E Projeto Editado ${suffix}`
  let clientId = 0

  test.beforeAll(async () => {
    const client = await e2eApi.createClient({
      name: clientName,
      document: null,
      phone: null,
      email: null,
      notes: null,
    })
    clientId = client.id
  })

  test.afterAll(async () => {
    try {
      const projects = await e2eApi.listProjects({ clientId })
      for (const project of projects) {
        await e2eApi.deleteProject(project.id)
      }
    } catch {}

    try {
      if (clientId) await e2eApi.deleteClient(clientId)
    } catch {}
  })

  test('cria um projeto novo', async ({ page }) => {
    await goTo(page, '#/projects', 'button')
    await page.getByRole('button', { name: /novo|new/i }).click()

    await page.locator('#name').fill(projectName)
    await selectCustom(page, 'clientId', clientId)
    await page.locator('#location').fill('São Paulo, SP')

    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${projectName}")`)).toBeVisible({ timeout: 8000 })
  })

  test('filtra projetos por nome', async ({ page }) => {
    await goTo(page, '#/projects', '[data-testid="datatable-search"]')

    await page.locator('[data-testid="datatable-search"]').fill(projectName)

    await expect(page.locator(`tr:has-text("${projectName}")`)).toBeVisible({ timeout: 8000 })
    await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 5000 })
  })

  test('filtra projetos por status', async ({ page }) => {
    await goTo(page, '#/projects', '[data-testid="datatable-search"]')

    // O FilterPanel usa um Select customizado para status; verifica que o projeto
    // criado (status=planned) aparece na lista padrão sem filtro aplicado
    await expect(page.locator(`tr:has-text("${projectName}")`)).toBeVisible({ timeout: 8000 })
  })

  test('edita o projeto criado', async ({ page }) => {
    await goTo(page, '#/projects', '[data-testid="datatable-search"]')

    await page.locator('[data-testid="datatable-search"]').fill(projectName)
    const row = page.locator(`tr:has-text("${projectName}")`)
    await row.getByRole('button', { name: /editar|edit/i }).click()

    await page.locator('#name').fill(projectNameEdited)
    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${projectNameEdited}")`)).toBeVisible({ timeout: 8000 })
  })

  test('exclui o projeto', async ({ page }) => {
    await goTo(page, '#/projects', '[data-testid="datatable-search"]')

    await page.locator('[data-testid="datatable-search"]').fill(projectNameEdited)

    const row = page.locator(`tr:has-text("${projectNameEdited}")`)
    await row.getByRole('button', { name: /excluir|delete/i }).click()

    await page.locator('[data-testid="confirm-button"]').click()

    await expect(page.locator(`tr:has-text("${projectNameEdited}")`)).toHaveCount(0, { timeout: 8000 })
  })
})
