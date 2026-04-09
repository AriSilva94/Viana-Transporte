import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE } from '../i18n/config'
import { normalizeLocale, resolveInitialLocale } from '../lib/locale'

describe('normalizeLocale', () => {
  it('normaliza variantes de portugues para pt-BR', () => {
    expect(normalizeLocale('pt')).toBe('pt-BR')
    expect(normalizeLocale('pt-PT')).toBe('pt-BR')
    expect(normalizeLocale('pt_br')).toBe('pt-BR')
  })

  it('normaliza variantes de ingles e espanhol', () => {
    expect(normalizeLocale('en-US')).toBe('en')
    expect(normalizeLocale('en')).toBe('en')
    expect(normalizeLocale('en_GB')).toBe('en')
    expect(normalizeLocale('en-Latn-US')).toBe('en')
    expect(normalizeLocale('es')).toBe('es')
    expect(normalizeLocale('es-MX')).toBe('es')
    expect(normalizeLocale('es_ES')).toBe('es')
    expect(normalizeLocale('es-419')).toBe('es')
  })

  it('usa o fallback padrao quando o valor eh vazio, desconhecido ou estranho', () => {
    expect(normalizeLocale('')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale('fr-FR')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale('english')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale('ptfoobar')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE)
  })
})

describe('resolveInitialLocale', () => {
  it('prioriza o idioma salvo apenas quando ele ja eh suportado', () => {
    expect(resolveInitialLocale('en', 'pt-BR')).toBe('en')
    expect(resolveInitialLocale('es', 'en-US')).toBe('es')
  })

  it('usa o locale do sistema quando nao ha idioma salvo valido', () => {
    expect(resolveInitialLocale(null, 'en-US')).toBe('en')
    expect(resolveInitialLocale(undefined, 'es-AR')).toBe('es')
    expect(resolveInitialLocale('fr' as never, 'en-US')).toBe('en')
    expect(resolveInitialLocale('pt-PT', 'en-US')).toBe('en')
    expect(resolveInitialLocale('en_US', 'pt-BR')).toBe('pt-BR')
  })

  it('faz fallback para o padrao quando nenhum valor e aproveitavel', () => {
    expect(resolveInitialLocale(null, 'fr-FR')).toBe(DEFAULT_LOCALE)
    expect(resolveInitialLocale(null, undefined)).toBe(DEFAULT_LOCALE)
  })
})
