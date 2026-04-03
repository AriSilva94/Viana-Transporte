import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { loadMainEnv } from './config/load-env'
import { initDataProvider, resolveDataProviderFromEnv } from './data/provider'
import { registerAllHandlers } from './ipc'
import { initLicenseState } from './services/license'

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
  registerAllHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}

void app.whenReady()
  .then(bootstrap)
  .catch((error: unknown) => {
    console.error('Failed to start MightyRept:', error)
    app.exit(1)
  })

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
