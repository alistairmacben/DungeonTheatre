import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': resolve('src/shared') } },
    build: { rollupOptions: { input: { index: resolve('src/main/index.ts') } } }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': resolve('src/shared') } },
    build: { rollupOptions: { input: { index: resolve('src/preload/index.ts') } } }
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@stage-ui': resolve('src/stage-ui'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          control: resolve('src/renderer/control.html'),
          stage: resolve('src/renderer/stage.html')
        }
      }
    }
  }
})
