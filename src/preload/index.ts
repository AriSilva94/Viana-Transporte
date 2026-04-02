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
  license: {
    getStatus: () => ipcRenderer.invoke('license:status'),
  },
}

contextBridge.exposeInMainWorld('api', api)
