import { ipcMain } from 'electron'

export function registerDashboardHandlers(): void {
  ipcMain.handle('dashboard:stats', () => ({
    activeProjects: 0,
    completedProjects: 0,
    totalMachines: 0,
    allocatedMachines: 0,
    totalCosts: 0,
    totalRevenues: 0,
    estimatedProfit: 0,
    recentLogs: [],
  }))
}
