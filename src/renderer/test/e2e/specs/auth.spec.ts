// auth.spec.ts — login válido, login inválido, logout
// Único spec que interage com a tela de login explicitamente.
// Usa fixture "unauthenticated" exportado pelo worker-harness (app sem auto-login).
import { test, expect } from '../fixtures/electron'
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from '../fixtures/credentials'

test.describe.serial('Auth', () => {
  test('login inválido exibe mensagem de erro', async ({ unauthenticatedPage: page }) => {
    await page.locator('[data-testid="auth-input-email"]').fill('naoexiste@viana.local')
    await page.locator('[data-testid="auth-input-password"]').fill('SenhaErrada!999')
    await page.locator('[data-testid="auth-submit"]').click()

    // A mensagem de erro deve aparecer (email ou password)
    const errorLocator = page
      .locator('[data-testid="auth-error-email"], [data-testid="auth-error-password"]')
      .first()
    await expect(errorLocator).toBeVisible({ timeout: 8000 })
  })

  test('login válido redireciona para a home', async ({ unauthenticatedPage: page }) => {
    await page.locator('[data-testid="auth-input-email"]').fill(E2E_ADMIN_EMAIL)
    await page.locator('[data-testid="auth-input-password"]').fill(E2E_ADMIN_PASSWORD)
    await page.locator('[data-testid="auth-submit"]').click()

    // Após login bem-sucedido, o botão de logout deve aparecer no shell
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible({ timeout: 10000 })
  })

  test('logout retorna para a tela de autenticação', async ({ page }) => {
    // page já vem autenticado pelo fixture padrão
    await page.locator('[data-testid="logout-button"]').click()

    // Deve exibir a tela de login
    await expect(page.locator('[data-testid="auth-submit"]')).toBeVisible({ timeout: 8000 })
  })
})
