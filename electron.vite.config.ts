import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const distProfile = process.env.DIST_PROFILE === 'trial' ? 'trial' : 'full'

export default defineConfig(() => {
  return {
    main: {
      define: {
        __DIST_PROFILE__: JSON.stringify(distProfile),
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
