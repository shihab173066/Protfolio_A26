import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// `base: './'` keeps asset URLs relative so the same build works on
// localhost, Firebase Hosting and a GitHub Pages project sub-path.
export default defineConfig({
  base: './',
  plugins: [vue()],
})
