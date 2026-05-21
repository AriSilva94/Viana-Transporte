import { app, BrowserWindow, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { loadMainEnv } from './config/load-env'
import { initDataProvider, resolveDataProviderFromEnv, setRepository } from './data/provider'
import { createSupabaseClientFromEnv } from './data/supabase/client'
import { createMemoryRepository } from './data/memory/repository'
import { registerAllHandlers } from './ipc'
import { createAuthService } from './auth/service'
import { createMemoryAuthService } from './auth/memory-service'
import { createProfileServiceFromSupabaseClient } from './auth/profile-service'
import { setAuthService } from './auth/runtime'
import { createAuthDeepLinkRuntime } from './auth/deep-link'
import { startAppLifecycle } from './app-lifecycle'
import { initLicenseState } from './services/license'
import { initUpdater } from './services/updater'

const IS_E2E_MEMORY_MODE = process.env.VIANA_E2E === '1'

const authDeepLinkRuntime = createAuthDeepLinkRuntime({
  skipSingleInstanceLock: IS_E2E_MEMORY_MODE,
})

Menu.setApplicationMenu(null)

function createWindow(): BrowserWindow {
  const iconPath = join(__dirname, '../../build/icon.ico')
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon: nativeImage.createFromPath(iconPath),
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
  loadMainEnv(app.isPackaged ? 'production' : 'development')
  await initLicenseState()

  if (IS_E2E_MEMORY_MODE) {
    console.log('[VIANA_E2E_MEMORY_MODE_MARKER]')
    setRepository(createMemoryRepository())
    setAuthService(createMemoryAuthService())
  } else {
    await initDataProvider(resolveDataProviderFromEnv())
    const profileService = createProfileServiceFromSupabaseClient(await createSupabaseClientFromEnv())
    const authService = createAuthService({ userDataPath: app.getPath('userData'), profileService })
    setAuthService(authService)
    authDeepLinkRuntime.attachAuthService(authService)
    await authService.getState()
  }

  registerAllHandlers()
  const mainWindow = createWindow()

  if (!IS_E2E_MEMORY_MODE) {
    initUpdater(mainWindow)
  }

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
    const message = error instanceof Error ? `${error.message}\n${error.stack}` : String(error)
    process.stderr.write(`[bootstrap-error] ${message}\n`)
    app.exit(1)
  },
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
