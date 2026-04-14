import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import { initializeI18n } from '../i18n'
import type { AuthState, UserProfileListItem } from '../../shared/types'

const mockUsers: UserProfileListItem[] = [
  {
    id: 'admin-user',
    email: 'admin@test.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'worker-user',
    email: 'worker@test.com',
    role: 'employee',
    status: 'revoked',
    createdAt: '2026-04-02T10:00:00.000Z',
  },
]

const usersApi = {
  list: vi.fn(),
  updateRole: vi.fn(),
  revokeAccess: vi.fn(),
  reactivateAccess: vi.fn(),
}

function createAdminState(userId = 'admin-user'): AuthState {
  return {
    session: null,
    profile: {
      id: userId,
      email: `${userId}@test.com`,
      role: 'admin',
      status: 'active',
    },
    pendingPasswordReset: false,
  }
}

async function renderUsersRoutes(
  initialEntry = '/users',
  state = createAdminState()
): Promise<void> {
  const { UsersPage } = await import('../pages/users')
  const { UserDetailPage } = await import('../pages/users/UserDetailPage')
  const { UserFormPage } = await import('../pages/users/UserFormPage')

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
        <MemoryRouter
          initialEntries={[initialEntry]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/users/:id/edit" element={<UserFormPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>
  )
}

describe('UsersPage', () => {
  beforeEach(async () => {
    usersApi.list.mockReset()
    usersApi.updateRole.mockReset()
    usersApi.revokeAccess.mockReset()
    usersApi.reactivateAccess.mockReset()

    usersApi.list.mockResolvedValue(mockUsers)
    usersApi.updateRole.mockResolvedValue(undefined)
    usersApi.revokeAccess.mockResolvedValue(undefined)
    usersApi.reactivateAccess.mockResolvedValue(undefined)

    window.api = {
      users: usersApi,
    } as Window['api']

    await initializeI18n('pt-BR')
  })

  it('loads and renders the users table with pt-BR accents', async () => {
    await renderUsersRoutes()

    expect(await screen.findByText('admin@test.com')).toBeInTheDocument()
    expect(screen.getByText('worker@test.com')).toBeInTheDocument()
    expect(screen.getByText('Gerenciamento de Usuários')).toBeInTheDocument()
  })

  it('disables the logged-in admin edit and access actions', async () => {
    await renderUsersRoutes()

    const buttons = await screen.findAllByRole('button', { name: 'Editar' })
    expect(buttons[0]).toBeDisabled()

    const revokeButtons = screen.getAllByRole('button', { name: 'Revogar acesso' })
    expect(revokeButtons[0]).toBeDisabled()
  })

  it('renders access status and a reactivate action for revoked users', async () => {
    await renderUsersRoutes()

    expect(await screen.findByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('Revogado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reativar acesso' })).toBeInTheDocument()
  })

  it('navigates to the user detail page from the list', async () => {
    const user = userEvent.setup()

    await renderUsersRoutes()

    const viewButtons = await screen.findAllByRole('button', { name: 'Ver' })
    await user.click(viewButtons[1])

    expect(await screen.findByText('Detalhes do Usuário')).toBeInTheDocument()
    expect(screen.getAllByText('worker@test.com').length).toBeGreaterThan(0)
    expect(screen.getByText('Funcionário')).toBeInTheDocument()
  })

  it('updates another user role from the edit page and returns to the list', async () => {
    const user = userEvent.setup()

    await renderUsersRoutes('/users/worker-user/edit')

    expect(await screen.findByText('Editar Perfil')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Perfil'), 'owner')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(usersApi.updateRole).toHaveBeenCalledWith('worker-user', 'owner')
    })

    expect(await screen.findByText('Gerenciamento de Usuários')).toBeInTheDocument()
  })

  it('revokes an active user access after confirmation', async () => {
    const user = userEvent.setup()
    usersApi.list
      .mockResolvedValueOnce([
        { ...mockUsers[0] },
        { ...mockUsers[1], id: 'employee-active', email: 'employee@test.com', status: 'active' },
      ])
      .mockResolvedValueOnce([
        { ...mockUsers[0] },
        { ...mockUsers[1], id: 'employee-active', email: 'employee@test.com', status: 'revoked' },
      ])

    await renderUsersRoutes()

    const revokeButtons = await screen.findAllByRole('button', { name: 'Revogar acesso' })
    await user.click(revokeButtons[1])
    expect(screen.getAllByText('Revogar acesso').length).toBeGreaterThan(0)
    expect(
      screen.getByText(
        'Tem certeza de que deseja revogar o acesso deste usuário? Os registros serão preservados, mas ele não conseguirá mais entrar no sistema.'
      )
    ).toBeInTheDocument()

    await user.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(usersApi.revokeAccess).toHaveBeenCalledWith('employee-active')
    })
  })

  it('reactivates a revoked user access after confirmation', async () => {
    const user = userEvent.setup()

    await renderUsersRoutes()

    await user.click(await screen.findByRole('button', { name: 'Reativar acesso' }))
    expect(screen.getAllByText('Reativar acesso').length).toBeGreaterThan(0)
    expect(
      screen.getByText(
        'Tem certeza de que deseja reativar o acesso deste usuário? Ele poderá entrar novamente no sistema.'
      )
    ).toBeInTheDocument()

    await user.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(usersApi.reactivateAccess).toHaveBeenCalledWith('worker-user')
    })
  })
})
