import { ipcMain } from 'electron'

export function registerProjectsHandlers(): void {
  ipcMain.handle('projects:list', () => [])
  ipcMain.handle('projects:get', () => null)
  ipcMain.handle('projects:create', () => null)
  ipcMain.handle('projects:update', () => null)
  ipcMain.handle('projects:delete', () => null)
  ipcMain.handle('projects:summary', () => ({
    totalCosts: 0,
    totalRevenues: 0,
    profit: 0,
    totalHours: 0,
  }))
}
