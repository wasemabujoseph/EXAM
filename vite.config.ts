import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.CF_PAGES ? "/" : "/EXAM/",
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
