import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thanhlvt.sudoku',
  appName: 'Sudoku',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      // White 3x3 board in res/drawable; Android tints it with this colour in the notification shade.
      smallIcon: 'ic_stat_sudoku',
      iconColor: '#7C3AED',
    },
    SystemBars: {
      // 'css' injects --safe-area-inset-* so the page can pad itself under the system bars.
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
