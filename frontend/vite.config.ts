import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3400,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3402',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
});
