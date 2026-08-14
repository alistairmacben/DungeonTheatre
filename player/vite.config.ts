import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

/**
 * The player web app. Separate from the Electron build because it ships to
 * browsers and phones, but it shares the stage renderer and the domain types
 * so the players' view can never drift from the DM's.
 */
export default defineConfig({
  root: __dirname,
  envDir: resolve(__dirname, '..'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../src/shared'),
      '@stage-ui': resolve(__dirname, '../src/stage-ui'),
      '@engine': resolve(__dirname, '../src/engine.ts')
    }
  },
  server: { port: 5273 },
  build: { outDir: resolve(__dirname, '../dist/player'), emptyOutDir: true }
})
