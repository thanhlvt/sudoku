import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// actions/configure-pages emits base_path without a trailing slash (e.g. "/sudoku").
// Vite normalizes that for its own asset URLs, but import.meta.env.BASE_URL is passed
// through raw, and code that builds paths as `${BASE_URL}puzzles/...` needs the slash.
const rawBase = process.env.VITE_BASE_PATH || '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export default defineConfig({
  // Set by the GitHub Pages workflow (actions/configure-pages) so the build works
  // both locally (base '/') and under a project-page subpath ('/<repo>/').
  base,
  plugins: [react()],
  test: {
    environment: 'node',
    globals: false,
  },
});
