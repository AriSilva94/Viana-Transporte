import { ipcMain } from 'electron'

export function registerCostsHandlers(): void {
  ipcMain.handle('costs:list', () => [])
  ipcMain.handle('costs:get', () => null)
  ipcMain.handle('costs:create', () => null)
  ipcMain.handle('costs:update', () => null)
  ipcMain.handle('costs:delete', () => null)
}
