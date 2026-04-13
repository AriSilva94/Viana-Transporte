import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import { i18n, initializeI18n } from '../i18n'
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher'
import { Sidebar } from '../components/layout/Sidebar'
import type { AuthState, AuthRole } from '../../shared/types'

const setLanguage = vi.fn<(...args: ['pt-BR' | 'en' | 'es']) => Promise<'pt-BR' | 'en' | 'es'>>()

function createAuthState(role: AuthRole): AuthState {
  return {
    session: null,
    profile: {
      id: 'current-user',
      email: 'current@test.com',
      role,
    },
    pendingPasswordReset: false,
  }
}

function renderSidebar(role: AuthRole): void {
  render(
    <AuthContext.Provider
      value={{
        state: createAuthState(role),
        loading: false,
        refresh: vi.fn(),
        signIn: vi.fn(),
        signUp: vi.fn(),
        requestPasswordReset: vi.fn(),
        updatePassword: vi.fn(),
        signOut: vi.fn(),
      }}
    >
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Sidebar />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    setLanguage.mockReset()
    setLanguage.mockResolvedValue('en')

    window.api = {
      getVersion: vi.fn().mockResolvedValue('1.0.10'),
      preferences: {
        getSystemLocale: vi.fn(),
        getSavedLanguage: vi.fn(),
        setLanguage,
      },
    } as Window['api']

    await initializeI18n('pt-BR')
  })

  it('troca o locale e persiste a preferencia selecionada', async () => {
    const user = userEvent.setup()

    render(<LanguageSwitcher />)

    expect(screen.getByTestId('locale-flag-pt-BR')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /idioma/i })).toHaveTextContent('Português')

    await user.click(screen.getByRole('button', { name: /idioma/i }))
    await user.click(screen.getByRole('menuitemradio', { name: /inglês/i }))

    await waitFor(() => {
      expect(setLanguage).toHaveBeenCalledWith('en')
      expect(screen.getByTestId('locale-flag-en')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /language/i })).toHaveTextContent('English')
    })
  })

  it('abre o menu acima do restante da interface', async () => {
    const user = userEvent.setup()

    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { name: /idioma/i }))

    expect(screen.getByRole('menu', { name: /idioma/i }).className).toContain('z-[80]')
  })

  it('mantem o locale atual quando a persistencia falha', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    setLanguage.mockRejectedValueOnce(new Error('persist failed'))

    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { name: /idioma/i }))
    await user.click(screen.getByRole('menuitemradio', { name: /inglês/i }))

    await waitFor(() => {
      expect(setLanguage).toHaveBeenCalledWith('en')
    })

    expect(screen.getByTestId('locale-flag-pt-BR')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /idioma/i })).toHaveTextContent('Português')
    expect(screen.queryByRole('button', { name: /language/i })).not.toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('renderiza a sidebar com traducoes do namespace navigation', async () => {
    await initializeI18n('es')

    render(
      <AuthContext.Provider
        value={{
          state: createAuthState('admin'),
          loading: false,
          refresh: vi.fn(),
          signIn: vi.fn(),
          signUp: vi.fn(),
          requestPasswordReset: vi.fn(),
          updatePassword: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Sidebar />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    expect(screen.getByText('Gestión operativa y financiera')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /panel/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /proyectos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /informes/i })).toBeInTheDocument()
  })

  it('mostra Usuarios na sidebar apenas para admin', async () => {
    await initializeI18n('pt-BR')

    renderSidebar('admin')

    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument()
  })

  it('oculta Usuarios na sidebar para owner e employee', async () => {
    await initializeI18n('pt-BR')

    renderSidebar('owner')
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument()
  })

  it('carrega o namespace auth na inicializacao do i18n', async () => {
    await initializeI18n('pt-BR')

    expect(i18n.hasResourceBundle('pt-BR', 'auth')).toBe(true)
    expect(i18n.t('auth:buttons.logout')).toBe('Sair')
    expect(i18n.t('auth:modes.signIn.title')).toBe('Entrar')
  })
})
