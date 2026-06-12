import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthService } from '../service'

const {
  appOnMock,
  getAllWindowsMock,
  requestSingleInstanceLockMock,
  setAsDefaultProtocolClientMock,
} = vi.hoisted(() => ({
  appOnMock: vi.fn(),
  getAllWindowsMock: vi.fn(),
  requestSingleInstanceLockMock: vi.fn(),
  setAsDefaultProtocolClientMock: vi.fn(),
}))

vi.mock('electron', () => ({
  app: {
    isPackaged: true,
    on: appOnMock,
    requestSingleInstanceLock: requestSingleInstanceLockMock,
    setAsDefaultProtocolClient: setAsDefaultProtocolClientMock,
  },
  BrowserWindow: {
    getAllWindows: getAllWindowsMock,
  },
}))

import { createAuthDeepLinkRuntime } from '../deep-link'

describe('auth deep-link runtime', () => {
  beforeEach(() => {
    appOnMock.mockReset()
    getAllWindowsMock.mockReset()
    requestSingleInstanceLockMock.mockReset()
    setAsDefaultProtocolClientMock.mockReset()
    requestSingleInstanceLockMock.mockReturnValue(true)
  })

  it('restores and brings the existing window forward after processing a recovery link', async () => {
    let secondInstanceHandler: ((_event: unknown, argv: string[]) => void) | undefined
    appOnMock.mockImplementation((event: string, handler: (...args: never[]) => void) => {
      if (event === 'second-instance') {
        secondInstanceHandler = handler as unknown as (_event: unknown, argv: string[]) => void
      }
    })

    const restore = vi.fn()
    const show = vi.fn()
    const focus = vi.fn()
    const moveTop = vi.fn()
    const send = vi.fn()
    getAllWindowsMock.mockReturnValue([
      {
        isMinimized: () => true,
        restore,
        show,
        focus,
        moveTop,
        webContents: { send },
      },
    ])

    const handleCallbackUrl = vi.fn().mockResolvedValue({
      session: null,
      profile: null,
      pendingPasswordReset: true,
      pendingPasswordResetToken: 'token',
    })
    const runtime = createAuthDeepLinkRuntime()
    runtime.attachAuthService({ handleCallbackUrl } as unknown as AuthService)

    secondInstanceHandler?.({}, ['viana-transporte://reset-password?token=token'])

    await vi.waitFor(() => {
      expect(handleCallbackUrl).toHaveBeenCalledWith(
        'viana-transporte://reset-password?token=token'
      )
      expect(send).toHaveBeenCalledWith('auth:sessionChanged')
      expect(restore).toHaveBeenCalledTimes(1)
      expect(show).toHaveBeenCalledTimes(1)
      expect(focus).toHaveBeenCalledTimes(1)
      expect(moveTop).toHaveBeenCalledTimes(1)
    })
  })
})
