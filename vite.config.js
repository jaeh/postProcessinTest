import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src', 'index.html'),
        nested: path.resolve(__dirname, 'src', 'composers', 'index.html'),
      },
    },
  },
})
