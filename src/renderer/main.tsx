import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initializeI18n } from './i18n'
import { DEFAULT_LOCALE } from './i18n/config'
import { resolveInitialLocale } from './lib/locale'
import './index.css'

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Root element not found')
  }

  const [savedLanguageResult, systemLocaleResult] = await Promise.allSettled([
    window.api.preferences.getSavedLanguage(),
    window.api.preferences.getSystemLocale(),
  ])

  const savedLanguage = savedLanguageResult.status === 'fulfilled' ? savedLanguageResult.value : null
  const systemLocale = systemLocaleResult.status === 'fulfilled' ? systemLocaleResult.value : DEFAULT_LOCALE

  const locale = resolveInitialLocale(savedLanguage, systemLocale)

  await initializeI18n(locale)

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

void bootstrap()
