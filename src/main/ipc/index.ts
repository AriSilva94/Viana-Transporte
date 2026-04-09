import { registerClientsHandlers } from './clients'
import { registerProjectsHandlers } from './projects'
import { registerMachinesHandlers } from './machines'
import { registerOperatorsHandlers } from './operators'
import { registerDailyLogsHandlers } from './dailylogs'
import { registerCostsHandlers } from './costs'
import { registerRevenuesHandlers } from './revenues'
import { registerDashboardHandlers } from './dashboard'
import { registerPreferencesHandlers } from './preferences'
import { registerLicenseHandlers } from './license'
import { registerAuthHandlers } from './auth'
import { registerUpdaterHandlers } from './updater'

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
  registerLicenseHandlers()
  registerAuthHandlers()
  registerUpdaterHandlers()
}
