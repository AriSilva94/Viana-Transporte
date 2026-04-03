import { beforeEach, describe, expect, it, vi } from 'vitest'

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
