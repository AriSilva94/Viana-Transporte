import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'

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
    await import('../../preload/index')

    const api = window.api as Window['api']

    await api.auth.getSession()
    await api.auth.signIn('a@b.com', '123456')
    await api.auth.signUp('a@b.com', '123456')
    await api.auth.requestPasswordReset('a@b.com')
    await api.auth.updatePassword('654321')
    await api.auth.signOut()

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
  })
})

describe('App auth flow', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    invokeMock.mockResolvedValue(undefined)

    window.api = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          session: null,
          pendingPasswordReset: false,
        }),
        signIn: vi.fn().mockResolvedValue({
          session: null,
          pendingPasswordReset: false,
        }),
        signUp: vi.fn(),
        requestPasswordReset: vi.fn(),
        updatePassword: vi.fn(),
        signOut: vi.fn(),
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
    } as Window['api']
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
      expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/e-mail/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), '123456')
    await user.click(screen.getAllByRole('button', { name: /entrar/i })[1])

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
      expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
    })
  })

  it('shows an inline error when signIn fails', async () => {
    const user = userEvent.setup()
    window.api.auth.signIn = vi.fn().mockRejectedValueOnce(new Error('invalid credentials'))
    const { default: App } = await import('../App')

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/e-mail/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), '123456')
    await user.click(screen.getAllByRole('button', { name: /entrar/i })[1])

    await waitFor(() => {
      expect(screen.getByText('invalid credentials')).toBeInTheDocument()
    })
  })
})
