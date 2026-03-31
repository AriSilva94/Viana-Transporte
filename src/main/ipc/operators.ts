import { ipcMain } from 'electron'

export function registerOperatorsHandlers(): void {
  ipcMain.handle('operators:list', () => [])
  ipcMain.handle('operators:get', () => null)
  ipcMain.handle('operators:create', () => null)
  ipcMain.handle('operators:update', () => null)
  ipcMain.handle('operators:delete', () => null)
}
