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
    createdAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'worker-user',
    email: 'worker@test.com',
    role: 'employee',
    createdAt: '2026-04-02T10:00:00.000Z',
  },
]

const usersApi = {
  list: vi.fn(),
  updateRole: vi.fn(),
  delete: vi.fn(),
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
    usersApi.delete.mockReset()

    usersApi.list.mockResolvedValue(mockUsers)
    usersApi.updateRole.mockResolvedValue(undefined)
    usersApi.delete.mockResolvedValue(undefined)

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

  it('disables the logged-in admin edit and delete actions', async () => {
    await renderUsersRoutes()

    const buttons = await screen.findAllByRole('button', { name: 'Editar' })
    expect(buttons[0]).toBeDisabled()

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' })
    expect(deleteButtons[0]).toBeDisabled()
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
})
