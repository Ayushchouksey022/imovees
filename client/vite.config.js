import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In dev/preview, /api is proxied to the Express server so cookies stay same-origin.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_PROXY_TARGET || process.env.VITE_PROXY_TARGET || 'http://localhost:5001';
  const proxy = { '/api': { target, changeOrigin: false }, '/socket.io': { target, ws: true, changeOrigin: false } };

  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    test: { environment: 'jsdom', setupFiles: './src/test/setup.js', globals: true, css: false },
  };
});
