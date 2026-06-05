// reports-export.spec.ts — relatórios e exportação (Excel/PDF) contra API real
//
// Tabs component é custom (sem ARIA roles): TabsList = plain <div>, TabsTrigger = <button>.
// Âncora de await: PageHeader renderiza <h1>.
// ExportMenu: trigger button[aria-haspopup="menu"], dropdown [role="menu"], itens [role="menuitem"].
//
// O ExportMenu tem disabled={rows.length===0}. Para habilitá-lo precisamos de dados reais.
// Seed/cleanup ficam fora da UI para manter este spec focado em relatorios/exportacao.
import { test, expect, goTo, uniqueSuffix } from '../fixtures/electron'
import { e2eApi } from '../fixtures/api'

test.describe.serial('Reports & Export', () => {
  const suffix = uniqueSuffix()
  const clientName = `E2E Cliente Rep ${suffix}`
  const projectName = `E2E Projeto Rep ${suffix}`
  let clientId = 0
  let projectId = 0
  let costId = 0
  let revenueId = 0

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
      contractAmount: 500,
      description: null,
    })
    projectId = project.id

    const cost = await e2eApi.createCost({
      date: new Date('2026-01-01T00:00:00.000Z'),
      projectId,
      machineId: null,
      operatorId: null,
      dailyLogId: null,
      category: 'fuel',
      description: `E2E Rep Custo ${suffix}`,
      amount: 100,
      notes: null,
    })
    costId = cost.id

    const revenue = await e2eApi.createRevenue({
      date: new Date('2026-01-01T00:00:00.000Z'),
      projectId,
      dailyLogId: null,
      description: `E2E Rep Receita ${suffix}`,
      amount: 500,
      status: 'received',
      notes: null,
    })
    revenueId = revenue.id
  })

  test.afterAll(async () => {
    const cleanup = [
      () => revenueId && e2eApi.deleteRevenue(revenueId),
      () => costId && e2eApi.deleteCost(costId),
      () => projectId && e2eApi.deleteProject(projectId),
      () => clientId && e2eApi.deleteClient(clientId),
    ]

    for (const remove of cleanup) {
      try {
        await remove()
      } catch {
        // Cleanup should not hide the test failure that produced the leftover.
      }
    }
  })

  test('carrega a página de relatórios e exibe as abas', async ({ page }) => {
    await goTo(page, '#/reports', 'h1')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })

    // TabsTrigger renderiza como <button> — verifica que ao menos um está visível
    const firstTabBtn = page.locator('button').filter({ hasText: /resumo|summary|diários|logs|máquinas|machine|custos|cost/i }).first()
    await expect(firstTabBtn).toBeVisible({ timeout: 8000 })
  })

  test('exibe tabela com dados na aba ativa após semear', async ({ page }) => {
    await goTo(page, '#/reports', 'h1')

    // Com dados semeados a aba project-summary deve mostrar uma <table>
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 })
  })

  test('botão exportar abre o menu com opções Excel e PDF', async ({ page }) => {
    await goTo(page, '#/reports', 'h1')
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 })

    // Com dados presentes o ExportMenu não está disabled
    const exportTrigger = page.getByRole('button', { name: /exportar|export/i })
    await expect(exportTrigger).toBeVisible({ timeout: 8000 })
    await expect(exportTrigger).toBeEnabled({ timeout: 5000 })

    await exportTrigger.click()

    await expect(page.locator('[role="menu"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[role="menuitem"]')).toHaveCount(2, { timeout: 5000 })
  })

  test('aciona exportação Excel sem erro', async ({ page }) => {
    await goTo(page, '#/reports', 'h1')
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 })

    const exportTrigger = page.getByRole('button', { name: /exportar|export/i })
    await exportTrigger.click()
    await expect(page.locator('[role="menu"]')).toBeVisible({ timeout: 5000 })

    const excelItem = page.locator('[role="menuitem"]').first()
    await excelItem.evaluate((el) => (el as HTMLElement).click())

    // Menu fecha após selecionar
    await expect(page.locator('[role="menu"]')).toHaveCount(0, { timeout: 8000 })
  })

  test('aciona exportação PDF sem erro', async ({ page }) => {
    await goTo(page, '#/reports', 'h1')
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 })

    const exportTrigger = page.getByRole('button', { name: /exportar|export/i })
    await exportTrigger.click()
    await expect(page.locator('[role="menu"]')).toBeVisible({ timeout: 5000 })

    const pdfItem = page.locator('[role="menuitem"]').nth(1)
    await pdfItem.evaluate((el) => (el as HTMLElement).click())

    await expect(page.locator('[role="menu"]')).toHaveCount(0, { timeout: 8000 })
  })
})
