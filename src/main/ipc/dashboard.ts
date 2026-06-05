import { ipcMain } from 'electron'
import { loadDashboardStats } from '../data/api/repository'

export function registerDashboardHandlers(): void {
  ipcMain.handle('dashboard:stats', () => loadDashboardStats())
}
