import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (key: string, value: unknown) => {
      ;(window as unknown as Window & Record<string, unknown>)[key] = value
    },
  },
  ipcRenderer: {
    invoke: vi.fn(),
  },
}))

describe('window.api auth bridge', () => {
  beforeEach(() => {
    delete (window as Window & { api?: unknown }).api
  })

  it('exposes auth methods on window.api', async () => {
    await import('../../preload/index')

    const api = window.api as Window['api'] & {
      auth?: {
        getSession?: unknown
        signIn?: unknown
        signUp?: unknown
        requestPasswordReset?: unknown
        updatePassword?: unknown
        signOut?: unknown
      }
    }

    expect(typeof api.auth?.getSession).toBe('function')
    expect(typeof api.auth?.signIn).toBe('function')
    expect(typeof api.auth?.signUp).toBe('function')
    expect(typeof api.auth?.requestPasswordReset).toBe('function')
    expect(typeof api.auth?.updatePassword).toBe('function')
    expect(typeof api.auth?.signOut).toBe('function')
  })
})
