import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every path relative, so the same build works on
// GitHub Pages (/Salat/), on localhost, and inside a native app bundle.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: true },
  test: { environment: 'node' },
});
