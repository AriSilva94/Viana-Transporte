import { config as loadDotenv } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

let loaded = false

export function loadMainEnv(): void {
  if (loaded) {
    return
  }

  const envFiles = ['.env.local', '.env']

  for (const file of envFiles) {
    const path = resolve(process.cwd(), file)
    if (!existsSync(path)) {
      continue
    }

    loadDotenv({ path, override: false })
  }

  loaded = true
}
