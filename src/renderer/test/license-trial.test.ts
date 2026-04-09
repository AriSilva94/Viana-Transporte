import { describe, expect, it } from 'vitest'
import { evaluateLicenseStatus } from '../../shared/license'

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
  })

  it('keeps trial writable before expiration', () => {
    const firstRunAtMs = Date.parse('2026-04-01T00:00:00Z')
    const nowMs = Date.parse('2026-04-03T23:59:59Z')

    const status = evaluateLicenseStatus({
      distributionMode: 'trial',
      firstRunAtMs,
      nowMs,
    })

    expect(status.readOnly).toBe(false)
    expect(status.isExpired).toBe(false)
    expect(status.daysRemaining).toBe(1)
  })

  it('locks trial exactly at 3 days', () => {
    const firstRunAtMs = Date.parse('2026-04-01T00:00:00Z')
    const nowMs = Date.parse('2026-04-04T00:00:00Z')

    const status = evaluateLicenseStatus({
      distributionMode: 'trial',
      firstRunAtMs,
      nowMs,
    })

    expect(status.readOnly).toBe(true)
    expect(status.isExpired).toBe(true)
    expect(status.daysRemaining).toBe(0)
  })
})