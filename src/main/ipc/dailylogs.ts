import { ipcMain } from 'electron'

export function registerDailyLogsHandlers(): void {
  ipcMain.handle('dailylogs:list', () => [])
  ipcMain.handle('dailylogs:get', () => null)
  ipcMain.handle('dailylogs:create', () => null)
  ipcMain.handle('dailylogs:update', () => null)
  ipcMain.handle('dailylogs:delete', () => null)
}
