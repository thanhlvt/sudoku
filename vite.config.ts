import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Set by the GitHub Pages workflow (actions/configure-pages) so the build works
  // both locally (base '/') and under a project-page subpath ('/<repo>/').
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  test: {
    environment: 'node',
    globals: false,
  },
});
