import { describe, expect, it } from 'vitest'
import { resolveDbPath } from '../../shared/db-path'

const providerModulePath = ['..', '..', 'main', 'data', 'provider'].join('/')

async function loadResolveDataProviderFromEnv(): Promise<() => 'sqlite' | 'supabase'> {
  const module = await import(providerModulePath)
  return module.resolveDataProviderFromEnv as () => 'sqlite' | 'supabase'
}

describe('resolveDbPath', () => {
  it('uses env override absolute path when provided', () => {
    const resolved = resolveDbPath({
      appPath: 'C:/app',
      userDataPath: 'C:/users/data',
      isPackaged: false,
      envDbPath: 'C:/tmp/e2e.db',
    })

    expect(resolved).toBe('C:/tmp/e2e.db')
  })

  it('uses env override relative path joined with app path', () => {
    const resolved = resolveDbPath({
      appPath: 'C:/app',
      userDataPath: 'C:/users/data',
      isPackaged: false,
      envDbPath: 'tmp/e2e.db',
    })

    expect(resolved.replaceAll('\\', '/')).toBe('C:/app/tmp/e2e.db')
  })

  it('uses dev default path when unpackaged and env is absent', () => {
    const resolved = resolveDbPath({
      appPath: 'C:/app',
      userDataPath: 'C:/users/data',
      isPackaged: false,
    })

    expect(resolved.replaceAll('\\', '/')).toBe('C:/app/dev.db')
  })

  it('uses userData default path when packaged and env is absent', () => {
    const resolved = resolveDbPath({
      appPath: 'C:/app',
      userDataPath: 'C:/users/data',
      isPackaged: true,
    })

    expect(resolved.replaceAll('\\', '/')).toBe('C:/users/data/mightyrept.db')
  })

  it('falls back to sqlite provider when env is absent', async () => {
    const originalProvider = process.env.MIGHTYREPT_DATA_PROVIDER

    try {
      delete process.env.MIGHTYREPT_DATA_PROVIDER

      const resolveDataProviderFromEnv = await loadResolveDataProviderFromEnv()

      expect(resolveDataProviderFromEnv()).toBe('sqlite')
    } finally {
      if (originalProvider === undefined) {
        delete process.env.MIGHTYREPT_DATA_PROVIDER
      } else {
        process.env.MIGHTYREPT_DATA_PROVIDER = originalProvider
      }
    }
  })

  it('falls back to sqlite provider when env is invalid', async () => {
    const originalProvider = process.env.MIGHTYREPT_DATA_PROVIDER

    try {
      process.env.MIGHTYREPT_DATA_PROVIDER = 'invalid-provider'

      const resolveDataProviderFromEnv = await loadResolveDataProviderFromEnv()

      expect(() => resolveDataProviderFromEnv()).toThrow('MIGHTYREPT_DATA_PROVIDER')
    } finally {
      if (originalProvider === undefined) {
        delete process.env.MIGHTYREPT_DATA_PROVIDER
      } else {
        process.env.MIGHTYREPT_DATA_PROVIDER = originalProvider
      }
    }
  })

  it('resolves supabase provider from env', async () => {
    const originalProvider = process.env.MIGHTYREPT_DATA_PROVIDER

    try {
      process.env.MIGHTYREPT_DATA_PROVIDER = 'supabase'

      const resolveDataProviderFromEnv = await loadResolveDataProviderFromEnv()

      expect(resolveDataProviderFromEnv()).toBe('supabase')
    } finally {
      if (originalProvider === undefined) {
        delete process.env.MIGHTYREPT_DATA_PROVIDER
      } else {
        process.env.MIGHTYREPT_DATA_PROVIDER = originalProvider
      }
    }
  })
})
