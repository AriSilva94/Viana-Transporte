import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import type { AppPreferences, SupportedLocale } from '../../shared/types'

const DEFAULT_PREFERENCES: AppPreferences = {
  language: null,
}

const SUPPORTED_LOCALES: SupportedLocale[] = ['pt-BR', 'en', 'es']

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

function sanitizePreferences(value: unknown): AppPreferences {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PREFERENCES
  }

  const language = Reflect.get(value, 'language')
  return {
    language: isSupportedLocale(language) ? language : null,
  }
}

export async function readPreferences(): Promise<AppPreferences> {
  try {
    const content = await readFile(getSettingsPath(), 'utf-8')
    return sanitizePreferences(JSON.parse(content))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return DEFAULT_PREFERENCES
    }

    return DEFAULT_PREFERENCES
  }
}

export async function writeLanguage(language: SupportedLocale): Promise<SupportedLocale> {
  if (!isSupportedLocale(language)) {
    throw new Error(`Unsupported locale: ${String(language)}`)
  }

  const settingsPath = getSettingsPath()
  await mkdir(dirname(settingsPath), { recursive: true })
  const nextPreferences: AppPreferences = { language }
  await writeFile(settingsPath, JSON.stringify(nextPreferences, null, 2), 'utf-8')
  return language
}
