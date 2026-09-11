import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative asset paths work both at the domain root and under a GitHub Pages project path.
  base: './',
  plugins: [react(), tailwindcss()],
})
