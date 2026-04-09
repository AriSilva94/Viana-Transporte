import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'
import log from 'electron-log'

declare const __DIST_PROFILE__: string

export function initUpdater(mainWindow: BrowserWindow | null): void {
  if (!mainWindow) {
    console.warn('Cannot initialize updater: mainWindow is null')
    return
  }

  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  if (__DIST_PROFILE__ === 'trial') {
    autoUpdater.channel = 'trial'
  }

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info)
    mainWindow?.webContents.send('updater:update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes || null,
      releaseDate: info.releaseDate || new Date().toISOString(),
    })
  })

  autoUpdater.on('update-not-available', () => {
    log.info('Update not available')
    mainWindow?.webContents.send('updater:update-not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    log.debug('Download progress:', progress)
    mainWindow?.webContents.send('updater:download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info)
    mainWindow?.webContents.send('updater:update-downloaded', {
      version: info.version,
      releaseNotes: info.releaseNotes || null,
      releaseDate: info.releaseDate || new Date().toISOString(),
    })
  })

  autoUpdater.on('error', (err) => {
    log.error('Update error:', err)
    mainWindow?.webContents.send('updater:error', {
      message: err instanceof Error ? err.message : String(err),
    })
  })

  // Check for updates 3 seconds after app loads
  setTimeout(() => {
    log.info('Checking for updates...')
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Failed to check for updates:', err)
    })
  }, 3000)
}
