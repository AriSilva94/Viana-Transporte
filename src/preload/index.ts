import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/types'

const api: ElectronAPI = {
  clients: {
    list: (filters) => ipcRenderer.invoke('clients:list', filters),
    get: (id) => ipcRenderer.invoke('clients:get', id),
    create: (data) => ipcRenderer.invoke('clients:create', data),
    update: (id, data) => ipcRenderer.invoke('clients:update', id, data),
    delete: (id) => ipcRenderer.invoke('clients:delete', id),
  },
  projects: {
    list: (filters) => ipcRenderer.invoke('projects:list', filters),
    get: (id) => ipcRenderer.invoke('projects:get', id),
    create: (data) => ipcRenderer.invoke('projects:create', data),
    update: (id, data) => ipcRenderer.invoke('projects:update', id, data),
    delete: (id) => ipcRenderer.invoke('projects:delete', id),
    summary: (id) => ipcRenderer.invoke('projects:summary', id),
  },
  machines: {
    list: (filters) => ipcRenderer.invoke('machines:list', filters),
    get: (id) => ipcRenderer.invoke('machines:get', id),
    create: (data) => ipcRenderer.invoke('machines:create', data),
    update: (id, data) => ipcRenderer.invoke('machines:update', id, data),
    delete: (id) => ipcRenderer.invoke('machines:delete', id),
  },
  operators: {
    list: (filters) => ipcRenderer.invoke('operators:list', filters),
    get: (id) => ipcRenderer.invoke('operators:get', id),
    create: (data) => ipcRenderer.invoke('operators:create', data),
    update: (id, data) => ipcRenderer.invoke('operators:update', id, data),
    delete: (id) => ipcRenderer.invoke('operators:delete', id),
  },
  dailylogs: {
    list: (filters) => ipcRenderer.invoke('dailylogs:list', filters),
    get: (id) => ipcRenderer.invoke('dailylogs:get', id),
    create: (data) => ipcRenderer.invoke('dailylogs:create', data),
    update: (id, data) => ipcRenderer.invoke('dailylogs:update', id, data),
    delete: (id) => ipcRenderer.invoke('dailylogs:delete', id),
  },
  costs: {
    list: (filters) => ipcRenderer.invoke('costs:list', filters),
    get: (id) => ipcRenderer.invoke('costs:get', id),
    create: (data) => ipcRenderer.invoke('costs:create', data),
    update: (id, data) => ipcRenderer.invoke('costs:update', id, data),
    delete: (id) => ipcRenderer.invoke('costs:delete', id),
  },
  revenues: {
    list: (filters) => ipcRenderer.invoke('revenues:list', filters),
    get: (id) => ipcRenderer.invoke('revenues:get', id),
    create: (data) => ipcRenderer.invoke('revenues:create', data),
    update: (id, data) => ipcRenderer.invoke('revenues:update', id, data),
    delete: (id) => ipcRenderer.invoke('revenues:delete', id),
  },
  dashboard: {
    stats: () => ipcRenderer.invoke('dashboard:stats'),
  },
  preferences: {
    getSystemLocale: () => ipcRenderer.invoke('preferences:getSystemLocale'),
    getSavedLanguage: () => ipcRenderer.invoke('preferences:getSavedLanguage'),
    setLanguage: (language) => ipcRenderer.invoke('preferences:setLanguage', language),
  },
  auth: {
    getSession: () => ipcRenderer.invoke('auth:getSession'),
    signIn: (email, password) => ipcRenderer.invoke('auth:signIn', { email, password }),
    signUp: (email, password) => ipcRenderer.invoke('auth:signUp', { email, password }),
    requestPasswordReset: (email) => ipcRenderer.invoke('auth:requestPasswordReset', { email }),
    updatePassword: (password) => ipcRenderer.invoke('auth:updatePassword', { password }),
    signOut: () => ipcRenderer.invoke('auth:signOut'),
    onSessionChanged: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('auth:sessionChanged', listener)
      return () => ipcRenderer.removeListener('auth:sessionChanged', listener)
    },
  },
  license: {
    getStatus: () => ipcRenderer.invoke('license:status'),
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    installUpdate: () => ipcRenderer.invoke('updater:install'),
    onUpdateAvailable: (callback: (info: unknown) => void) => {
      const listener = (_: unknown, info: unknown) => callback(info)
      ipcRenderer.on('updater:update-available', listener)
      return () => ipcRenderer.removeListener('updater:update-available', listener)
    },
    onUpdateDownloaded: (callback: (info: unknown) => void) => {
      const listener = (_: unknown, info: unknown) => callback(info)
      ipcRenderer.on('updater:update-downloaded', listener)
      return () => ipcRenderer.removeListener('updater:update-downloaded', listener)
    },
    onDownloadProgress: (callback: (progress: unknown) => void) => {
      const listener = (_: unknown, progress: unknown) => callback(progress)
      ipcRenderer.on('updater:download-progress', listener)
      return () => ipcRenderer.removeListener('updater:download-progress', listener)
    },
    onError: (callback: (error: unknown) => void) => {
      const listener = (_: unknown, error: unknown) => callback(error)
      ipcRenderer.on('updater:error', listener)
      return () => ipcRenderer.removeListener('updater:error', listener)
    },
    onUpdateNotAvailable: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('updater:update-not-available', listener)
      return () => ipcRenderer.removeListener('updater:update-not-available', listener)
    },
  },
}

contextBridge.exposeInMainWorld('api', api)
