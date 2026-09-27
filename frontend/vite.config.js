import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // No VITE_ prefix: BACKEND_URL is only used by the dev proxy and never shipped to the browser.
  const { BACKEND_URL = 'http://localhost:3000' } = loadEnv(mode, import.meta.dirname, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
      proxy: {
        '/api': { target: BACKEND_URL, changeOrigin: true },
      },
    },
  }
})
