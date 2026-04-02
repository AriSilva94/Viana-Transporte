import { registerClientsHandlers } from './clients'
import { registerProjectsHandlers } from './projects'
import { registerMachinesHandlers } from './machines'
import { registerOperatorsHandlers } from './operators'
import { registerDailyLogsHandlers } from './dailylogs'
import { registerCostsHandlers } from './costs'
import { registerRevenuesHandlers } from './revenues'
import { registerDashboardHandlers } from './dashboard'
import { registerPreferencesHandlers } from './preferences'

export function registerAllHandlers(): void {
  registerClientsHandlers()
  registerProjectsHandlers()
  registerMachinesHandlers()
  registerOperatorsHandlers()
  registerDailyLogsHandlers()
  registerCostsHandlers()
  registerRevenuesHandlers()
  registerDashboardHandlers()
  registerPreferencesHandlers()
}
