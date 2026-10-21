import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// actions/configure-pages emits base_path without a trailing slash (e.g. "/sudoku").
// Vite normalizes that for its own asset URLs, but import.meta.env.BASE_URL is passed
// through raw, and code that builds paths as `${BASE_URL}puzzles/...` needs the slash.
const rawBase = process.env.VITE_BASE_PATH || '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

// Defence in depth: the app has no XSS sink today, but a CSP means a future slip can't load or run foreign code.
// Everything is same-origin (the build inlines nothing but small fonts as data: URIs); style-src needs
// 'unsafe-inline' because React writes inline `style` attributes. Static hosts like GitHub Pages cannot send
// headers, hence the <meta> tag. Only the production build gets it -- the dev server injects inline scripts.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'sudoku-content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: () => [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ],
    },
  };
}

export default defineConfig(({ mode }) => ({
  // Set by the GitHub Pages workflow (actions/configure-pages) so the build works
  // both locally (base '/') and under a project-page subpath ('/<repo>/').
  base,
  plugins: [
    react(),
    // The Android WebView gets Capacitor's native bridge injected into the page, which a strict
    // script-src can block; `npm run android:sync` builds with `--mode capacitor` to leave the CSP out.
    ...(mode === 'capacitor' ? [] : [contentSecurityPolicy()]),
  ],
  test: {
    environment: 'node',
    globals: false,
  },
}));
