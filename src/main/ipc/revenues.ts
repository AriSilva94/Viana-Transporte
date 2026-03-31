import { ipcMain } from 'electron'

export function registerRevenuesHandlers(): void {
  ipcMain.handle('revenues:list', () => [])
  ipcMain.handle('revenues:get', () => null)
  ipcMain.handle('revenues:create', () => null)
  ipcMain.handle('revenues:update', () => null)
  ipcMain.handle('revenues:delete', () => null)
}
