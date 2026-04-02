import { describe, expect, it } from 'vitest'
import { shouldSeedInitialData } from '../../shared/seed'

describe('shouldSeedInitialData', () => {
  it('returns true when key tables are empty', () => {
    expect(
      shouldSeedInitialData({
        clientsCount: 0,
        projectsCount: 0,
        revenuesCount: 0,
        costsCount: 0,
      })
    ).toBe(true)
  })

  it('returns false when data already exists', () => {
    expect(
      shouldSeedInitialData({
        clientsCount: 1,
        projectsCount: 0,
        revenuesCount: 0,
        costsCount: 0,
      })
    ).toBe(false)
  })
})
