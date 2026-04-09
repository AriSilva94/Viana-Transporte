import { describe, expect, it } from 'vitest'
import { endOfLocalDay, isLocalDateWithinInclusiveRange, parseLocalDate } from '../../shared/date'

describe('isLocalDateWithinInclusiveRange', () => {
  it('inclui o dia final inteiro no range', () => {
    const value = parseLocalDate('2026-03-05')
    const from = parseLocalDate('2026-03-01')
    const to = endOfLocalDay('2026-03-05')

    expect(isLocalDateWithinInclusiveRange(value, from, to)).toBe(true)
  })

  it('exclui datas fora do range local', () => {
    const value = parseLocalDate('2026-03-06')
    const from = parseLocalDate('2026-03-01')
    const to = endOfLocalDay('2026-03-05')

    expect(isLocalDateWithinInclusiveRange(value, from, to)).toBe(false)
  })
})
