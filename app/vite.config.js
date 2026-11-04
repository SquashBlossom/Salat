import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// base './' keeps every path relative, so the same build works on
// GitHub Pages (/Salat/), on localhost, and inside a native app bundle.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist', emptyOutDir: true, sourcemap: true,
    // two pages: the app, and the design kit (kit.html)
    rollupOptions: { input: { app: resolve(import.meta.dirname, 'index.html'), kit: resolve(import.meta.dirname, 'kit.html') } },
  },
  test: { environment: 'node' },
});
