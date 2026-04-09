export type DistributionMode = 'full' | 'trial'

export const TRIAL_DURATION_DAYS = 11
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000

export interface LicenseStatus {
  distributionMode: DistributionMode
  firstRunAtMs: number | null
  expiresAtMs: number | null
  isExpired: boolean
  readOnly: boolean
  daysRemaining: number | null
}

interface EvaluateLicenseStatusInput {
  distributionMode: DistributionMode
  nowMs: number
  firstRunAtMs?: number
}

export function evaluateLicenseStatus(input: EvaluateLicenseStatusInput): LicenseStatus {
  if (input.distributionMode === 'full') {
    return {
      distributionMode: 'full',
      firstRunAtMs: null,
      expiresAtMs: null,
      isExpired: false,
      readOnly: false,
      daysRemaining: null,
    }
  }

  const firstRunAtMs = input.firstRunAtMs ?? input.nowMs
  const expiresAtMs = firstRunAtMs + TRIAL_DURATION_MS
  const isExpired = input.nowMs >= expiresAtMs
  const remainingMs = Math.max(0, expiresAtMs - input.nowMs)
  const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000))

  return {
    distributionMode: 'trial',
    firstRunAtMs,
    expiresAtMs,
    isExpired,
    readOnly: isExpired,
    daysRemaining,
  }
}
