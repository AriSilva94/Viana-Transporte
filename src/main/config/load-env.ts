import { config as loadDotenv } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { getEnvFilesForMode } from './env-selection'

let loaded = false

export function loadMainEnv(mode: 'development' | 'production' = 'development'): void {
  if (loaded) {
    return
  }

  for (const file of getEnvFilesForMode(mode)) {
    const path = resolve(process.cwd(), file)
    if (!existsSync(path)) {
      continue
    }

    loadDotenv({ path, override: false })
  }

  loaded = true
}
