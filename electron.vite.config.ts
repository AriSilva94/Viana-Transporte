import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { loadBuildEnv, type BuildMode } from './src/main/config/env-selection'

const distProfile = process.env.DIST_PROFILE === 'trial' ? 'trial' : 'full'

export default defineConfig(({ command, mode }) => {
  const buildMode: BuildMode =
    mode === 'test' ? 'test' : mode === 'e2e' ? 'e2e' : command === 'build' ? 'production' : 'development'
  const isTestBuild = buildMode === 'test'

  const envKeys = ['VIANA_API_BASE_URL']
  const buildEnv = loadBuildEnv({
    cwd: process.cwd(),
    mode: buildMode,
    processEnv: process.env,
    envKeys,
  })

  return {
    main: {
      define: {
        __DIST_PROFILE__: JSON.stringify(distProfile),
        'process.env.VIANA_API_BASE_URL': JSON.stringify(buildEnv.VIANA_API_BASE_URL ?? ''),
        'process.env.VIANA_E2E': JSON.stringify(isTestBuild ? '1' : ''),
      },
      plugins: [externalizeDepsPlugin()]
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer')
        }
      },
      plugins: [react()]
    }
  }
})
