import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

/**
 * Wire the Android hardware/gesture Back button to the hash router:
 * on a sub-screen go back to the home screen, on home leave the app.
 * Returns a cleanup function. No-op in the browser.
 */
export function setupBackButton(): () => void {
  if (!isNative) return () => {};
  const handle = App.addListener('backButton', () => {
    if (window.location.hash && window.location.hash !== '#/') {
      window.location.hash = '#/';
    } else {
      void App.exitApp();
    }
  });
  return () => {
    void handle.then((h) => h.remove());
  };
}
