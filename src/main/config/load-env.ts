import { config as loadDotenv } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { getEnvFilesForMode } from './env-selection'

let loaded = false

function resolveEnvBasePath(): string {
  if (process.type === 'browser') {
    const { app } = require('electron' as any)
    if (app.isPackaged) {
      return resolve(process.resourcesPath)
    }
  }
  return process.cwd()
}

export function loadMainEnv(mode: 'development' | 'production' = 'development'): void {
  if (loaded) {
    return
  }

  const basePath = resolveEnvBasePath()

  for (const file of getEnvFilesForMode(mode)) {
    const envPath = resolve(basePath, file)
    if (!existsSync(envPath)) {
      continue
    }

    loadDotenv({ path: envPath, override: false })
  }

  loaded = true
}
