import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative asset paths so dist/ works from any folder (e.g. VS Code Live Server).
  base: './',
  plugins: [react(), tailwindcss()],
  // Dev: forward /api to the local FastAPI server (uvicorn on :8000).
  server: {
    proxy: { '/api': 'http://localhost:8000' },
  },
});
