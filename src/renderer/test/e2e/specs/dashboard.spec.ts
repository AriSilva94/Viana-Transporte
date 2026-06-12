// dashboard.spec.ts — smoke do dashboard e dado deterministico via API e2e
import { test, expect, goTo, uniqueSuffix } from '../fixtures/electron'
import { e2eApi } from '../fixtures/api'

test.describe.serial('Dashboard', () => {
  const suffix = uniqueSuffix()
  const clientName = `E2E Cliente Dashboard ${suffix}`
  const projectName = `E2E Projeto Dashboard ${suffix}`
  let clientId = 0
  let projectId = 0

  test('carrega a página do dashboard sem erros', async ({ page }) => {
    await goTo(page, '#/', 'h1')

    // O título do dashboard está em um <h1> dentro do banner hero
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })
  })

  test('exibe cards de métricas após carregar', async ({ page }) => {
    await goTo(page, '#/', 'h1')

    // O dashboard tem seções <h2> dentro dos SectionCards — indica que
    // o componente terminou de carregar e renderizou o conteúdo completo
    await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('exibe a seção de diários recentes (tabela ou estado vazio)', async ({ page }) => {
    await goTo(page, '#/', 'h1')

    // Aguarda o SectionCard de diários recentes; o estado vazio do Dashboard
    // é um <div> com texto, não usa EmptyState com data-testid.
    // A seção sempre renderiza algum conteúdo depois de carregar — verifica h2.
    await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 })

    // Se há logs, a <table> aparece; se não há, um <div> de estado vazio.
    // Ambos vivem dentro de um <section> — basta confirmar que a seção existe.
    const section = page.locator('section').first()
    await expect(section).toBeVisible({ timeout: 10000 })
  })

  test('exibe projeto ativo criado por seed de API', async ({ page }) => {
    const client = await e2eApi.createClient({
      name: clientName,
      document: '12.345.678/0001-99',
      phone: '(11) 99999-0001',
      email: `e2e-dashboard-${suffix}@viana.local`,
      notes: null,
    })
    clientId = client.id

    const project = await e2eApi.createProject({
      clientId,
      name: projectName,
      location: 'Dashboard E2E',
      status: 'active',
      startDate: new Date('2026-01-01'),
      endDate: null,
      contractAmount: null,
      description: 'Seed criado por API para validar dashboard',
    })
    projectId = project.id

    await goTo(page, '#/', 'h1')

    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(clientName)).toBeVisible({ timeout: 10000 })
  })

  test.afterAll(async () => {
    for (const cleanup of [
      () => projectId && e2eApi.deleteProject(projectId),
      () => clientId && e2eApi.deleteClient(clientId),
    ]) {
      try {
        await cleanup()
      } catch {
        // Best-effort cleanup for e2e data.
      }
    }
  })
})
