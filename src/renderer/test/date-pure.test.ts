import { describe, expect, it } from 'vitest'
import { endOfLocalDay, formatLocalDate, parseLocalDate } from '../../shared/date'

describe('local date helpers', () => {
  it('preserva a data de calendario no round-trip de YYYY-MM-DD', () => {
    const parsed = parseLocalDate('2026-03-05')

    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(2)
    expect(parsed.getDate()).toBe(5)
    expect(formatLocalDate(parsed)).toBe('2026-03-05')
  })

  it('gera o fim do dia local para incluir toda a data final', () => {
    const end = endOfLocalDay(parseLocalDate('2026-03-05'))

    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(2)
    expect(end.getDate()).toBe(5)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
    expect(end.getSeconds()).toBe(59)
    expect(end.getMilliseconds()).toBe(999)
  })
})
