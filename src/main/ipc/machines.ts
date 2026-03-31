import { ipcMain } from 'electron'

export function registerMachinesHandlers(): void {
  ipcMain.handle('machines:list', () => [])
  ipcMain.handle('machines:get', () => null)
  ipcMain.handle('machines:create', () => null)
  ipcMain.handle('machines:update', () => null)
  ipcMain.handle('machines:delete', () => null)
}
