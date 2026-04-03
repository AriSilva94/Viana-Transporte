import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { loadMainEnv } from './config/load-env'
import { initDataProvider, resolveDataProviderFromEnv } from './data/provider'
import { registerAllHandlers } from './ipc'
import { createAuthService } from './auth/service'
import { setAuthService } from './auth/runtime'
import { createAuthDeepLinkRuntime } from './auth/deep-link'
import { startAppLifecycle } from './app-lifecycle'
import { initLicenseState } from './services/license'

const authDeepLinkRuntime = createAuthDeepLinkRuntime()

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: 'default',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

async function bootstrap(): Promise<void> {
  loadMainEnv()
  await initLicenseState()
  await initDataProvider(resolveDataProviderFromEnv())
  const authService = createAuthService({ userDataPath: app.getPath('userData') })
  setAuthService(authService)
  authDeepLinkRuntime.attachAuthService(authService)
  await authService.getState()
  registerAllHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}

startAppLifecycle({
  shouldQuit: authDeepLinkRuntime.shouldQuit,
  whenReady: () => app.whenReady(),
  quit: () => app.quit(),
  bootstrap,
  onError: (error: unknown) => {
    console.error('Failed to start MightyRept:', error)
    app.exit(1)
  },
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
