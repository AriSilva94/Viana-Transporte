import { describe, expect, it } from 'vitest'
import { formatDecimal } from '../lib/format'

describe('formatDecimal', () => {
  it('formata decimais com virgula em pt-BR', () => {
    expect(formatDecimal(12.5, 'pt-BR')).toBe('12,5')
    expect(formatDecimal(12, 'pt-BR')).toBe('12')
  })

  it('formata decimais com ponto em en', () => {
    expect(formatDecimal(12.5, 'en')).toBe('12.5')
    expect(formatDecimal(12, 'en')).toBe('12')
  })
})
