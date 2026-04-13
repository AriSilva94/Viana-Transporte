import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { initializeI18n } from '../i18n'
import { AuthPage } from '../pages/auth/AuthPage'
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../pages/auth/authSchemas'
import type { TFunction } from 'i18next'

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}))

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (key: string, value: unknown) => {
      ;(window as unknown as Window & Record<string, unknown>)[key] = value
    },
  },
  ipcRenderer: {
    invoke: invokeMock,
  },
}))

describe('window.api auth bridge', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    invokeMock.mockResolvedValue(undefined)
    delete (window as Window & { api?: unknown }).api
  })

  it('forwards auth calls to the expected IPC channels', async () => {
    const preloadModulePath = '../../preload/index'
    await import(preloadModulePath)

    const api = window.api as Window['api']

    await api.auth.getSession()
    await api.auth.signIn('a@b.com', '123456')
    await api.auth.signUp('a@b.com', '123456')
    await api.auth.requestPasswordReset('a@b.com')
    await api.auth.updatePassword('654321')
    await api.auth.signOut()
    await api.users.list()
    await api.users.updateRole('user-2', 'owner')

    expect(invokeMock).toHaveBeenNthCalledWith(1, 'auth:getSession')
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'auth:signIn', {
      email: 'a@b.com',
      password: '123456',
    })
    expect(invokeMock).toHaveBeenNthCalledWith(3, 'auth:signUp', {
      email: 'a@b.com',
      password: '123456',
    })
    expect(invokeMock).toHaveBeenNthCalledWith(4, 'auth:requestPasswordReset', {
      email: 'a@b.com',
    })
    expect(invokeMock).toHaveBeenNthCalledWith(5, 'auth:updatePassword', {
      password: '654321',
    })
    expect(invokeMock).toHaveBeenNthCalledWith(6, 'auth:signOut')
    expect(invokeMock).toHaveBeenNthCalledWith(7, 'users:list')
    expect(invokeMock).toHaveBeenNthCalledWith(8, 'users:updateRole', {
      userId: 'user-2',
      role: 'owner',
    })
  })
})

describe('App auth flow', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    invokeMock.mockResolvedValue(undefined)

    window.api = {
      getVersion: vi.fn().mockResolvedValue('1.0.10'),
      auth: {
        getSession: vi.fn().mockResolvedValue({
          session: null,
          profile: null,
          pendingPasswordReset: false,
        }),
        signIn: vi.fn().mockResolvedValue({
          session: null,
          profile: null,
          pendingPasswordReset: false,
        }),
        signUp: vi.fn(),
        requestPasswordReset: vi.fn(),
        updatePassword: vi.fn(),
        signOut: vi.fn().mockResolvedValue(undefined),
        onSessionChanged: vi.fn().mockImplementation((callback: () => void) => {
          // Mock implementation for onSessionChanged
          return () => {
            // Return cleanup function
          }
        }),
      },
      users: {
        list: vi.fn().mockResolvedValue([]),
        updateRole: vi.fn().mockResolvedValue(undefined),
      },
      preferences: {
        getSystemLocale: vi.fn().mockResolvedValue('pt-BR'),
        getSavedLanguage: vi.fn().mockResolvedValue(null),
        setLanguage: vi.fn(),
      },
      license: {
        getStatus: vi.fn().mockResolvedValue({
          distributionMode: 'full',
          firstRunAtMs: null,
          expiresAtMs: null,
          isExpired: false,
          readOnly: false,
          daysRemaining: null,
        }),
      },
      updater: {
        checkForUpdates: vi.fn().mockResolvedValue({ success: true, updateAvailable: false }),
        installUpdate: vi.fn().mockResolvedValue({ success: true }),
        onUpdateAvailable: vi.fn().mockImplementation(() => () => undefined),
        onUpdateDownloaded: vi.fn().mockImplementation(() => () => undefined),
        onDownloadProgress: vi.fn().mockImplementation(() => () => undefined),
        onError: vi.fn().mockImplementation(() => () => undefined),
        onUpdateNotAvailable: vi.fn().mockImplementation(() => () => undefined),
      },
      projects: {
        list: vi.fn().mockResolvedValue([]),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        summary: vi.fn(),
      },
      machines: {
        list: vi.fn().mockResolvedValue([]),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      operators: {
        list: vi.fn().mockResolvedValue([]),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      dailylogs: {
        list: vi.fn().mockResolvedValue([]),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      costs: {
        list: vi.fn().mockResolvedValue([]),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      revenues: {
        list: vi.fn().mockResolvedValue([]),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as Window['api']
  })

  beforeEach(async () => {
    await initializeI18n('pt-BR')
  })

  it('renders the login screen when there is no session and submits signIn', async () => {
    const user = userEvent.setup()
    const { default: App } = await import('../App')

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('auth-input-email'), 'a@b.com')
    await user.type(screen.getByTestId('auth-input-password'), '123456')
    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => {
      expect(window.api.auth.signIn).toHaveBeenCalledWith('a@b.com', '123456')
    })
  })

  it('falls back to the login screen when getSession fails', async () => {
    window.api.auth.getSession = vi.fn().mockRejectedValueOnce(new Error('offline'))
    const { default: App } = await import('../App')

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText(/carregando autenticação/i)).not.toBeInTheDocument()
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })
  })

  it('shows an inline error when signIn fails', async () => {
    const user = userEvent.setup()
    window.api.auth.signIn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Invalid login credentials'))
    const { default: App } = await import('../App')

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('auth-input-email'), 'a@b.com')
    await user.type(screen.getByTestId('auth-input-password'), '123456')
    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha inválidos')).toBeInTheDocument()
    })
  })

  it('renders protected shell content and exposes logout when a session exists', async () => {
    const user = userEvent.setup()
    window.api.auth.getSession = vi.fn().mockResolvedValue({
      session: {
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user-1',
        email: 'a@b.com',
        expiresAt: null,
      },
      profile: {
        id: 'user-1',
        email: 'a@b.com',
        role: 'admin',
      },
      pendingPasswordReset: false,
    })
    const { default: App } = await import('../App')

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
      expect(screen.queryByTestId('auth-mode-title')).not.toBeInTheDocument()
    })

    await user.click(screen.getByTestId('logout-button'))

    await waitFor(() => {
      expect(window.api.auth.signOut).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })
  })

  it('exposes the profile role through the auth context to consumers', async () => {
    window.api.auth.getSession = vi.fn().mockResolvedValue({
      session: null,
      profile: {
        id: 'user-1',
        email: 'a@b.com',
        role: 'admin',
      },
      pendingPasswordReset: false,
    })

    render(
      <AuthProvider>
        <AuthRoleProbe />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-role')).toHaveTextContent('admin')
    })
  })

  it('redirects non-admin users away from the users route', async () => {
    window.api.auth.getSession = vi.fn().mockResolvedValue({
      session: {
        accessToken: 'token',
        refreshToken: 'refresh',
        userId: 'user-1',
        email: 'owner@b.com',
        expiresAt: null,
      },
      profile: {
        id: 'user-1',
        email: 'owner@b.com',
        role: 'owner',
      },
      pendingPasswordReset: false,
    })

    window.location.hash = '#/users'
    const { default: App } = await import('../App')

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Dashboard', current: 'page' })).toBeInTheDocument()
      expect(screen.queryByText('Gerenciamento de Usuarios')).not.toBeInTheDocument()
    })
  })

  it('switches auth modes inside the same card and updates the footer copy', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
      expect(screen.getByTestId('auth-link-to-sign-up')).toBeInTheDocument()
      expect(screen.getByTestId('auth-link-to-forgot')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('auth-link-to-sign-up'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
      expect(screen.getByTestId('auth-link-to-sign-in')).toBeInTheDocument()
      expect(screen.getByTestId('auth-link-to-forgot')).toBeInTheDocument()
      expect(screen.queryByTestId('auth-link-to-sign-up')).not.toBeInTheDocument()
    })

    await user.click(screen.getByTestId('auth-link-to-forgot'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
      expect(screen.getByTestId('auth-link-to-sign-in')).toBeInTheDocument()
      expect(screen.getByTestId('auth-link-to-sign-up')).toBeInTheDocument()
      expect(screen.queryByTestId('auth-link-to-forgot')).not.toBeInTheDocument()
    })
  })

  it('applies forward and backward transition directions when switching modes', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-transition-layer')).toHaveAttribute('data-direction', 'forward')
    })

    await user.click(screen.getByTestId('auth-link-to-sign-up'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-transition-layer')).toHaveAttribute('data-direction', 'forward')
    })

    await user.click(screen.getByTestId('auth-link-to-sign-in'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-transition-layer')).toHaveAttribute('data-direction', 'backward')
    })
  })

  it('shows contextual loading label on submit for each auth mode', async () => {
    const user = userEvent.setup()
    const resolveSignInRef: { current?: () => void } = {}
    const resolveSignUpRef: { current?: () => void } = {}

    window.api.auth.signIn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignInRef.current = () =>
            resolve({ session: null, profile: null, pendingPasswordReset: false })
        })
    )

    window.api.auth.signUp = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignUpRef.current = () => resolve(undefined)
        })
    )

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-submit')).toHaveTextContent('Entrar')
    })

    await user.type(screen.getByTestId('auth-input-email'), 'a@b.com')
    await user.type(screen.getByTestId('auth-input-password'), '123456')
    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-submit')).toHaveTextContent('Entrando...')
      expect(screen.getByTestId('auth-submit')).toBeDisabled()
    })

    resolveSignInRef.current?.()

    await waitFor(() => {
      expect(screen.getByTestId('auth-submit')).toHaveTextContent('Entrar')
      expect(screen.getByTestId('auth-submit')).not.toBeDisabled()
    })

    await user.click(screen.getByTestId('auth-link-to-sign-up'))
    await user.type(screen.getByTestId('auth-input-email'), 'a@b.com')
    await user.type(screen.getByTestId('auth-input-password'), '123456')
    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-submit')).toHaveTextContent('Criando conta...')
      expect(screen.getByTestId('auth-submit')).toBeDisabled()
    })

    resolveSignUpRef.current?.()

    await waitFor(() => {
      expect(screen.getByTestId('auth-submit')).toHaveTextContent('Criar conta')
      expect(screen.getByTestId('auth-submit')).not.toBeDisabled()
    })
  })

  it('moves focus to the first field of the active mode', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-input-email')).toHaveFocus()
    })

    await user.click(screen.getByTestId('auth-link-to-sign-up'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-input-email')).toHaveFocus()
    })

    await user.click(screen.getByTestId('auth-link-to-forgot'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-input-email')).toHaveFocus()
    })
  })

  it('shows inline email error when submitting empty email in signIn', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-error-email')).toBeInTheDocument()
      expect(screen.getByTestId('auth-error-email')).toHaveTextContent('Informe seu e-mail')
    })

    expect(window.api.auth.signIn).not.toHaveBeenCalled()
  })

  it('shows inline email error when submitting an invalid email format', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('auth-input-email'), 'notanemail')
    await user.type(screen.getByTestId('auth-input-password'), '123456')
    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-error-email')).toHaveTextContent('Digite um e-mail válido')
    })

    expect(window.api.auth.signIn).not.toHaveBeenCalled()
  })

  it('shows inline password error when submitting with empty password in signIn', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('auth-input-email'), 'a@b.com')
    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-error-password')).toHaveTextContent('Informe sua senha')
    })

    expect(window.api.auth.signIn).not.toHaveBeenCalled()
  })

  it('maps known Supabase error to a friendly message', async () => {
    const user = userEvent.setup()
    window.api.auth.signIn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Invalid login credentials'))

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('auth-input-email'), 'a@b.com')
    await user.type(screen.getByTestId('auth-input-password'), '123456')
    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha inválidos')).toBeInTheDocument()
    })
  })

  it('renders LanguageSwitcher on the auth page', async () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })

    // LocaleFlag renders a flag SVG with data-testid based on the current locale (pt-BR in tests)
    expect(screen.getByTestId('locale-flag-pt-BR')).toBeInTheDocument()
  })

  it('toggles password visibility in signIn mode', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-input-password')).toBeInTheDocument()
    })

    const passwordInput = screen.getByTestId('auth-input-password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleButton = screen.getByTestId('auth-toggle-password')
    await user.click(toggleButton)

    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(toggleButton)

    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('resets password visibility when switching auth mode', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-input-password')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('auth-toggle-password'))
    expect(screen.getByTestId('auth-input-password')).toHaveAttribute('type', 'text')

    await user.click(screen.getByTestId('auth-link-to-sign-up'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-input-password')).toHaveAttribute('type', 'password')
    })
  })

  it('shows inline email error when signUp fails with email already registered', async () => {
    const user = userEvent.setup()
    window.api.auth.signUp = vi
      .fn()
      .mockRejectedValueOnce(new Error('User already registered'))

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-mode-title')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('auth-link-to-sign-up'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-input-email')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('auth-input-email'), 'existing@b.com')
    await user.type(screen.getByTestId('auth-input-password'), '123456')
    await user.click(screen.getByTestId('auth-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-error-email')).toHaveTextContent(
        'Este e-mail já possui uma conta'
      )
    })
  })
})

const mockT = ((key: string) => key) as unknown as TFunction

function AuthRoleProbe() {
  const { state } = useAuth()

  return <div data-testid="auth-role">{state?.profile?.role ?? 'missing'}</div>
}

describe('authSchemas', () => {
  describe('signInSchema', () => {
    it('fails when email is empty', () => {
      const result = signInSchema(mockT).safeParse({ email: '', password: '123456' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined()
      }
    })

    it('fails when email is not a valid address', () => {
      const result = signInSchema(mockT).safeParse({ email: 'notanemail', password: '123456' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined()
      }
    })

    it('fails when password is empty', () => {
      const result = signInSchema(mockT).safeParse({ email: 'a@b.com', password: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined()
      }
    })

    it('passes with valid email and password', () => {
      const result = signInSchema(mockT).safeParse({ email: 'a@b.com', password: '123456' })
      expect(result.success).toBe(true)
    })
  })

  describe('signUpSchema', () => {
    it('fails when password is shorter than 6 characters', () => {
      const result = signUpSchema(mockT).safeParse({ email: 'a@b.com', password: '123' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined()
      }
    })

    it('passes with valid email and password of 6+ characters', () => {
      const result = signUpSchema(mockT).safeParse({ email: 'a@b.com', password: '123456' })
      expect(result.success).toBe(true)
    })
  })

  describe('forgotPasswordSchema', () => {
    it('fails when email is empty', () => {
      const result = forgotPasswordSchema(mockT).safeParse({ email: '' })
      expect(result.success).toBe(false)
    })

    it('passes with valid email', () => {
      const result = forgotPasswordSchema(mockT).safeParse({ email: 'a@b.com' })
      expect(result.success).toBe(true)
    })
  })

  describe('resetPasswordSchema', () => {
    it('fails when password is shorter than 6 characters', () => {
      const result = resetPasswordSchema(mockT).safeParse({ password: '123' })
      expect(result.success).toBe(false)
    })

    it('passes with password of 6+ characters', () => {
      const result = resetPasswordSchema(mockT).safeParse({ password: '123456' })
      expect(result.success).toBe(true)
    })
  })
})
