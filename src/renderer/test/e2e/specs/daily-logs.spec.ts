// daily-logs.spec.ts — CRUD completo de diários de obra contra API real
// DailyLogs list NÃO tem campo de busca por texto — filtragem via Select customizado
// (projeto/máquina/operador) e DatePicker. O spec valida diretamente na tabela.
import { test, expect, goTo, selectCustom, uniqueSuffix } from '../fixtures/electron'
import { e2eApi } from '../fixtures/api'

test.describe.serial('DailyLogs', () => {
  const suffix = uniqueSuffix()
  const clientName = `E2E Cliente DL ${suffix}`
  const projectName = `E2E Projeto DL ${suffix}`
  const workDesc = `E2E Trabalho ${suffix}`
  const workDescEdited = `E2E Trabalho Editado ${suffix}`
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
      const dailyLogs = await e2eApi.listDailyLogs({ projectId })
      for (const dailyLog of dailyLogs) {
        await e2eApi.deleteDailyLog(dailyLog.id)
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

  test('cria um diário de obra', async ({ page }) => {
    await goTo(page, '#/daily-logs', 'button')
    await page.getByRole('button', { name: /novo|new/i }).click()

    // date já tem default = hoje
    await selectCustom(page, 'projectId', projectId)
    await page.locator('#hoursWorked').fill('8')
    await page.locator('#workDescription').fill(workDesc)

    await page.getByRole('button', { name: /salvar|save/i }).click()

    // A lista não tem busca por texto — valida presença direta na tabela
    await expect(page.locator(`tr:has-text("${projectName}")`)).toBeVisible({ timeout: 8000 })
  })

  test('verifica que o diário aparece na listagem', async ({ page }) => {
    // DailyLogs list não tem campo de busca — navega e confirma que a linha existe
    await goTo(page, '#/daily-logs', 'table, [data-testid="empty-state"]')
    await expect(page.locator(`tr:has-text("${projectName}")`)).toBeVisible({ timeout: 8000 })
  })

  test('edita o diário criado', async ({ page }) => {
    await goTo(page, '#/daily-logs', 'table, [data-testid="empty-state"]')

    const row = page.locator(`tr:has-text("${projectName}")`).first()
    await row.getByRole('button', { name: /editar|edit/i }).click()

    await page.locator('#workDescription').fill(workDescEdited)
    await page.getByRole('button', { name: /salvar|save/i }).click()

    await expect(page.locator(`tr:has-text("${projectName}")`)).toBeVisible({ timeout: 8000 })
  })

  test('exclui o diário', async ({ page }) => {
    await goTo(page, '#/daily-logs', 'table, [data-testid="empty-state"]')

    const row = page.locator(`tr:has-text("${projectName}")`).first()
    await row.getByRole('button', { name: /excluir|delete/i }).click()
    await page.locator('[data-testid="confirm-button"]').click()

    await expect(page.locator(`tr:has-text("${projectName}")`)).toHaveCount(0, { timeout: 8000 })
  })
})
