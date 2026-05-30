import { describe, expect, it } from 'vitest'
import { TRIAL_DURATION_DAYS, evaluateLicenseStatus } from '../../shared/license'

const DAY_MS = 24 * 60 * 60 * 1000
const FIRST_RUN_AT_MS = Date.parse('2026-04-01T00:00:00Z')

function nowAtDayOffset(days: number, extraMs = 0): number {
  return FIRST_RUN_AT_MS + days * DAY_MS + extraMs
}

describe('evaluateLicenseStatus', () => {
  it('returns full mode without restrictions', () => {
    const status = evaluateLicenseStatus({
      distributionMode: 'full',
      nowMs: Date.parse('2026-04-02T12:00:00Z'),
    })

    expect(status.distributionMode).toBe('full')
    expect(status.readOnly).toBe(false)
    expect(status.isExpired).toBe(false)
    expect(status.expiresAtMs).toBeNull()
    expect(status.daysRemaining).toBeNull()
  })

  it('keeps trial writable on first run', () => {
    const status = evaluateLicenseStatus({
      distributionMode: 'trial',
      firstRunAtMs: FIRST_RUN_AT_MS,
      nowMs: FIRST_RUN_AT_MS,
    })

    expect(status.readOnly).toBe(false)
    expect(status.isExpired).toBe(false)
    expect(status.daysRemaining).toBe(TRIAL_DURATION_DAYS)
  })

  it('keeps trial writable with one day remaining', () => {
    const status = evaluateLicenseStatus({
      distributionMode: 'trial',
      firstRunAtMs: FIRST_RUN_AT_MS,
      nowMs: nowAtDayOffset(TRIAL_DURATION_DAYS - 1),
    })

    expect(status.readOnly).toBe(false)
    expect(status.isExpired).toBe(false)
    expect(status.daysRemaining).toBe(1)
  })

  it('locks trial exactly at expiration boundary', () => {
    const status = evaluateLicenseStatus({
      distributionMode: 'trial',
      firstRunAtMs: FIRST_RUN_AT_MS,
      nowMs: nowAtDayOffset(TRIAL_DURATION_DAYS),
    })

    expect(status.readOnly).toBe(true)
    expect(status.isExpired).toBe(true)
    expect(status.daysRemaining).toBe(0)
  })

  it('stays locked after expiration', () => {
    const status = evaluateLicenseStatus({
      distributionMode: 'trial',
      firstRunAtMs: FIRST_RUN_AT_MS,
      nowMs: nowAtDayOffset(TRIAL_DURATION_DAYS + 5),
    })

    expect(status.readOnly).toBe(true)
    expect(status.isExpired).toBe(true)
    expect(status.daysRemaining).toBe(0)
  })

  it('defaults firstRunAtMs to nowMs when omitted', () => {
    const nowMs = Date.parse('2026-04-01T00:00:00Z')
    const status = evaluateLicenseStatus({
      distributionMode: 'trial',
      nowMs,
    })

    expect(status.firstRunAtMs).toBe(nowMs)
    expect(status.expiresAtMs).toBe(nowMs + TRIAL_DURATION_DAYS * DAY_MS)
    expect(status.readOnly).toBe(false)
  })
})
