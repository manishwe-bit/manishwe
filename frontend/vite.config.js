import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative asset paths so dist/ works from any folder (e.g. VS Code Live Server).
  base: './',
  plugins: [react(), tailwindcss()],
  // Libraries in their own files: they stay cached in visitors' browsers when only site code changes.
  build: {
    rollupOptions: {
      output: { manualChunks: { react: ['react', 'react-dom'], gsap: ['gsap'] } },
    },
  },
  // Dev: forward /api to the local FastAPI server (uvicorn on :8000).
  server: {
    proxy: { '/api': { target: 'http://localhost:8000', ws: true } }, // ws: live cursors
  },
});
