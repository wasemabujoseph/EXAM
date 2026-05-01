import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  base: process.env.CF_PAGES ? "/" : "/EXAM/",
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});