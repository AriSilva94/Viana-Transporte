import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { UpdateInfo, DownloadProgress, UpdateError } from '../../shared/types'

export interface UpdaterState {
  updateAvailable: boolean
  updateDownloaded: boolean
  updateInfo: UpdateInfo | null
  downloadProgress: DownloadProgress | null
  error: UpdateError | null
  isChecking: boolean
  isInstalling: boolean
}

export function useUpdater(): UpdaterState & {
  checkForUpdates: () => Promise<void>
  installUpdate: () => Promise<void>
} {
  const [state, setState] = useState<UpdaterState>({
    updateAvailable: false,
    updateDownloaded: false,
    updateInfo: null,
    downloadProgress: null,
    error: null,
    isChecking: false,
    isInstalling: false,
  })

  const checkForUpdates = useCallback(async () => {
    setState((prev) => ({ ...prev, isChecking: true }))
    try {
      await api.updater.checkForUpdates()
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error checking for updates',
        },
      }))
    } finally {
      setState((prev) => ({ ...prev, isChecking: false }))
    }
  }, [])

  const installUpdate = useCallback(async () => {
    setState((prev) => ({ ...prev, isInstalling: true }))
    try {
      await api.updater.installUpdate()
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error installing update',
        },
      }))
    } finally {
      setState((prev) => ({ ...prev, isInstalling: false }))
    }
  }, [])

  // Listen to update events
  useEffect(() => {
    const unsubscribeAvailable = api.updater.onUpdateAvailable((info: unknown) => {
      setState((prev) => ({
        ...prev,
        updateAvailable: true,
        updateInfo: info as UpdateInfo,
      }))
    })

    const unsubscribeDownloaded = api.updater.onUpdateDownloaded((info: unknown) => {
      setState((prev) => ({
        ...prev,
        updateDownloaded: true,
        updateInfo: info as UpdateInfo,
        downloadProgress: null,
      }))
    })

    const unsubscribeProgress = api.updater.onDownloadProgress((progress: unknown) => {
      setState((prev) => ({
        ...prev,
        downloadProgress: progress as DownloadProgress,
      }))
    })

    const unsubscribeError = api.updater.onError((error: unknown) => {
      setState((prev) => ({
        ...prev,
        error: error as UpdateError,
      }))
    })

    const unsubscribeNotAvailable = api.updater.onUpdateNotAvailable(() => {
      setState((prev) => ({
        ...prev,
        updateAvailable: false,
      }))
    })

    return () => {
      unsubscribeAvailable()
      unsubscribeDownloaded()
      unsubscribeProgress()
      unsubscribeError()
      unsubscribeNotAvailable()
    }
  }, [])

  return {
    ...state,
    checkForUpdates,
    installUpdate,
  }
}
