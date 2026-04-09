import { app, ipcMain } from 'electron'
import type { SupportedLocale } from '../../shared/types'
import { readPreferences, writeLanguage } from '../services/settings'

export function registerPreferencesHandlers(): void {
  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('preferences:getSystemLocale', () => app.getLocale())
  ipcMain.handle('preferences:getSavedLanguage', async () => {
    const preferences = await readPreferences()
    return preferences.language
  })
  ipcMain.handle('preferences:setLanguage', async (_, language: SupportedLocale) => {
    return writeLanguage(language)
  })
}
