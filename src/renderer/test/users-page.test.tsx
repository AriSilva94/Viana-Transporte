import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import { initializeI18n } from '../i18n'
import type { AuthState } from '../../shared/types'

const usersApi = {
  list: vi.fn(),
  updateRole: vi.fn(),
}

function createAdminState(userId = 'admin-user'): AuthState {
  return {
    session: null,
    profile: {
      id: userId,
      email: `${userId}@test.com`,
      role: 'admin',
    },
    pendingPasswordReset: false,
  }
}

async function renderUsersPage(state = createAdminState()): Promise<void> {
  const { UsersPage } = await import('../pages/users')

  render(
    <AuthContext.Provider
      value={{
        state,
        loading: false,
        refresh: vi.fn(),
        signIn: vi.fn(),
        signUp: vi.fn(),
        requestPasswordReset: vi.fn(),
        updatePassword: vi.fn(),
        signOut: vi.fn(),
      }}
    >
      <ToastProvider>
        <UsersPage />
      </ToastProvider>
    </AuthContext.Provider>
  )
}

describe('UsersPage', () => {
  beforeEach(async () => {
    usersApi.list.mockReset()
    usersApi.updateRole.mockReset()

    usersApi.list
      .mockResolvedValueOnce([
        {
          id: 'admin-user',
          email: 'admin@test.com',
          role: 'admin',
          createdAt: '2026-04-01T10:00:00.000Z',
        },
        {
          id: 'worker-user',
          email: 'worker@test.com',
          role: 'employee',
          createdAt: '2026-04-02T10:00:00.000Z',
        },
      ])
      .mockResolvedValue([
        {
          id: 'admin-user',
          email: 'admin@test.com',
          role: 'admin',
          createdAt: '2026-04-01T10:00:00.000Z',
        },
        {
          id: 'worker-user',
          email: 'worker@test.com',
          role: 'owner',
          createdAt: '2026-04-02T10:00:00.000Z',
        },
      ])
    usersApi.updateRole.mockResolvedValue(undefined)

    window.api = {
      users: usersApi,
    } as Window['api']

    await initializeI18n('pt-BR')
  })

  it('loads and renders the users table', async () => {
    await renderUsersPage()

    expect(await screen.findByText('admin@test.com')).toBeInTheDocument()
    expect(screen.getByText('worker@test.com')).toBeInTheDocument()
    expect(screen.getByText('Gerenciamento de Usuarios')).toBeInTheDocument()
  })

  it('disables the logged-in admin action', async () => {
    await renderUsersPage()

    expect(await screen.findByTestId('user-role-action-admin-user')).toBeDisabled()
  })

  it('updates another user role and shows success feedback', async () => {
    const user = userEvent.setup()

    await renderUsersPage()

    await user.selectOptions(await screen.findByTestId('user-role-select-worker-user'), 'owner')

    await waitFor(() => {
      expect(usersApi.updateRole).toHaveBeenCalledWith('worker-user', 'owner')
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-role-select-worker-user')).toHaveValue('owner')
    })
    expect(screen.getAllByText('Proprietario').length).toBeGreaterThan(0)
  })
})
