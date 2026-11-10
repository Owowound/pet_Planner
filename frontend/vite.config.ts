import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-сервер Vite проксирует все запросы /api на шлюз.
// Для браузера фронт и API находятся на одном адресе, поэтому CORS не нужен.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5100',
        changeOrigin: true,
      },
    },
  },
});
