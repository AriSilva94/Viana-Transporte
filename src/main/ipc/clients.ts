import { ipcMain } from 'electron'

export function registerClientsHandlers(): void {
  ipcMain.handle('clients:list', () => [])
  ipcMain.handle('clients:get', () => null)
  ipcMain.handle('clients:create', () => null)
  ipcMain.handle('clients:update', () => null)
  ipcMain.handle('clients:delete', () => null)
}
