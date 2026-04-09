import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate } from '../lib/format'

describe('formatCurrency', () => {
  it('formata moeda em real brasileiro por padrao', () => {
    const formatted = formatCurrency(1234.56, 'pt-BR')

    expect(formatted).toContain('R$')
    expect(formatted).toContain('1.234,56')
  })

  it('mantem o formato monetario brasileiro mesmo em outros idiomas', () => {
    const formattedEn = formatCurrency(1234.5, 'en')
    const formattedEs = formatCurrency(1234.5, 'es')

    expect(formattedEn).toContain('R$')
    expect(formattedEn).toContain('1.234,50')
    expect(formattedEs).toContain('R$')
    expect(formattedEs).toContain('1.234,50')
  })

  it('nao troca a moeda para simbolos de outros paises ao mudar o idioma', () => {
    const formattedEn = formatCurrency(99.9, 'en')
    const formattedEs = formatCurrency(99.9, 'es')

    expect(formattedEn).not.toContain('US$')
    expect(formattedEn).not.toContain('$99.90')
    expect(formattedEs).not.toContain('€')
  })
})

describe('formatDate', () => {
  it('retorna placeholder quando o valor nao existe', () => {
    expect(formatDate(null, 'pt-BR')).toBe('—')
    expect(formatDate(undefined, 'en')).toBe('—')
    expect(formatDate('', 'es')).toBe('—')
  })

  it('retorna placeholder quando a data eh invalida', () => {
    expect(formatDate('not-a-date', 'pt-BR')).toBe('—')
    expect(formatDate(Number.NaN, 'en')).toBe('—')
  })

  it('formata datas validas usando o locale informado', () => {
    const value = new Date('2026-03-05T12:00:00Z')

    expect(formatDate(value, 'pt-BR')).toBe('05/03/2026')
    expect(formatDate(value, 'en')).toBe('03/05/2026')
  })

  it('preserva a data de calendario para strings ISO date-only', () => {
    expect(formatDate('2026-03-05', 'pt-BR')).toBe('05/03/2026')
    expect(formatDate('2026-03-05', 'en')).toBe('03/05/2026')
  })
})
