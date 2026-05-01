import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

const isGitHubPages = process.env.DEPLOY_TARGET === 'github';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? "/EXAM/" : "/",
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
