import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Production builds are served from GitHub Pages at /Social_Cafe/; dev stays at /.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/Social_Cafe/' : '/',
  plugins: [react()],
}))
