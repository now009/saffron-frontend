import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8000,
    proxy: {
      '/qbank-images': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    configureServer(server) {
      server.middlewares.use('/main', (req, res, next) => {
        req.url = '/main.html'
        next()
      })
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'main.html'),
      },
    },
  },
})
