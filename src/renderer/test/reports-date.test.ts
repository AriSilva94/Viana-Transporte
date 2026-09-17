import { describe, expect, it, vi } from 'vitest'
import { todaySlug } from '../pages/reports'

describe('todaySlug', () => {
  it('usa a data local para os filtros do relatório', () => {
    vi.setSystemTime(new Date('2026-06-04T02:00:00.000Z'))

    expect(todaySlug()).toBe('2026-06-03')

    vi.useRealTimers()
  })
})
