import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import {
  DistributionMode,
  LicenseStatus,
  evaluateLicenseStatus,
} from '../../shared/license'

declare const __DIST_PROFILE__: string

interface PersistedTrialState {
  firstRunAtMs: number
}

const TRIAL_STATE_FILE = 'trial-license-state.json'
const WRITE_BLOCK_MESSAGE =
  'Versao de avaliacao expirada. O aplicativo esta em modo somente visualizacao.'

let cachedTrialFirstRunAtMs: number | null = null

function resolveDistributionMode(): DistributionMode {
  return __DIST_PROFILE__ === 'trial' ? 'trial' : 'full'
}

function getTrialStatePath(): string {
  return join(app.getPath('userData'), TRIAL_STATE_FILE)
}

async function readTrialState(): Promise<PersistedTrialState | null> {
  try {
    const stateRaw = await fs.readFile(getTrialStatePath(), 'utf-8')
    const state = JSON.parse(stateRaw) as Partial<PersistedTrialState>

    if (!state.firstRunAtMs || typeof state.firstRunAtMs !== 'number') {
      return null
    }

    return { firstRunAtMs: state.firstRunAtMs }
  } catch {
    return null
  }
}

async function writeTrialState(state: PersistedTrialState): Promise<void> {
  await fs.writeFile(getTrialStatePath(), JSON.stringify(state), 'utf-8')
}

async function ensureTrialFirstRunAtMs(nowMs: number): Promise<number> {
  if (cachedTrialFirstRunAtMs) {
    return cachedTrialFirstRunAtMs
  }

  const persisted = await readTrialState()

  if (persisted) {
    cachedTrialFirstRunAtMs = persisted.firstRunAtMs
    return persisted.firstRunAtMs
  }

  const state: PersistedTrialState = { firstRunAtMs: nowMs }
  await writeTrialState(state)
  cachedTrialFirstRunAtMs = state.firstRunAtMs
  return state.firstRunAtMs
}

export async function initLicenseState(): Promise<void> {
  const distributionMode = resolveDistributionMode()
  if (distributionMode === 'full') {
    return
  }

  await ensureTrialFirstRunAtMs(Date.now())
}

export async function getLicenseStatus(): Promise<LicenseStatus> {
  const distributionMode = resolveDistributionMode()
  const nowMs = Date.now()

  if (distributionMode === 'full') {
    return evaluateLicenseStatus({ distributionMode, nowMs })
  }

  const firstRunAtMs = await ensureTrialFirstRunAtMs(nowMs)
  return evaluateLicenseStatus({ distributionMode, firstRunAtMs, nowMs })
}

export async function assertWriteAllowed(): Promise<void> {
  const status = await getLicenseStatus()

  if (status.readOnly) {
    throw new Error(WRITE_BLOCK_MESSAGE)
  }
}
