import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Same-origin in development too: the browser calls /api on :5173 and Vite forwards it to Express.
    proxy: { '/api': 'http://localhost:5000' },
  },
});
