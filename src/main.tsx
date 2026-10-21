import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setLanguage } from './i18n';
import { isNative } from './native';
import { loadSettings } from './storage/schema';
import { ErrorBoundary } from './ui/ErrorBoundary';

// Pick the language before the first paint so a fixed (non-device) choice never flashes the device language.
setLanguage(loadSettings().language);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Installable + offline on the web. Not in dev (it would cache stale modules) and not in the Android app,
// which already ships every file inside the APK.
if (import.meta.env.PROD && !isNative && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline support is optional; the game works the same without it.
    });
  });
}
