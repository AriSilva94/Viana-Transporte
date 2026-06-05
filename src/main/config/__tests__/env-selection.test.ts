import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import { getEnvFilesForMode, loadBuildEnv } from '../env-selection'

describe('getEnvFilesForMode', () => {
  it('returns .env and .env.local when mode is development', () => {
    expect(getEnvFilesForMode('development')).toEqual(['.env', '.env.local'])
  })

  it('uses production env files when mode is production', () => {
    expect(getEnvFilesForMode('production')).toEqual(['.env.production'])
  })
})

describe('loadBuildEnv', () => {
  it('loads production values from .env.production before falling back to process env', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'env-selection-'))

    try {
      writeFileSync(
        join(tempDir, '.env.production'),
        ['VIANA_API_BASE_URL=https://api.production.example.com'].join('\n'),
        'utf-8'
      )

      const env = loadBuildEnv({
        cwd: tempDir,
        mode: 'production',
        processEnv: {
          VIANA_API_BASE_URL: 'https://api.process.example.com',
        },
        envKeys: ['VIANA_API_BASE_URL'],
      })

      expect(env).toEqual({
        VIANA_API_BASE_URL: 'https://api.production.example.com',
      })
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
