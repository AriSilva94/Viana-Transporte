import { ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

export function registerUpdaterHandlers(): void {
  ipcMain.handle('updater:check', async () => {
    log.info('Manual update check requested')
    try {
      const result = await autoUpdater.checkForUpdates()
      return { success: true, updateAvailable: result?.updateInfo !== null }
    } catch (err) {
      log.error('Error checking for updates:', err)
      throw err
    }
  })

  ipcMain.handle('updater:install', async () => {
    log.info('Install and quit requested')
    try {
      autoUpdater.quitAndInstall()
      return { success: true }
    } catch (err) {
      log.error('Error installing update:', err)
      throw err
    }
  })
}
