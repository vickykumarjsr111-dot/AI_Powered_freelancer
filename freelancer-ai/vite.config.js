import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],

  server: {
    open: true,
    watch: {
      usePolling: true,
      interval: 1,
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },
})