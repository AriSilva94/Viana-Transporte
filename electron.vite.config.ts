import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { loadBuildEnv, type BuildMode } from './src/main/config/env-selection'

const distProfile = process.env.DIST_PROFILE === 'trial' ? 'trial' : 'full'

export default defineConfig(({ command, mode }) => {
  const buildMode: BuildMode =
    mode === 'test' ? 'test' : command === 'build' ? 'production' : 'development'
  const isTestBuild = buildMode === 'test'

  const envKeys = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'SUPABASE_AUTH_REDIRECT_URL']
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
        'process.env.SUPABASE_URL': JSON.stringify(buildEnv.SUPABASE_URL ?? ''),
        'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(buildEnv.SUPABASE_SERVICE_ROLE_KEY ?? ''),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(buildEnv.SUPABASE_ANON_KEY ?? ''),
        'process.env.SUPABASE_AUTH_REDIRECT_URL': JSON.stringify(buildEnv.SUPABASE_AUTH_REDIRECT_URL ?? ''),
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
