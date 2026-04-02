import { handleRead } from './guarded'
import { getLicenseStatus } from '../services/license'

export function registerLicenseHandlers(): void {
  handleRead('license:status', async () => getLicenseStatus())
}
