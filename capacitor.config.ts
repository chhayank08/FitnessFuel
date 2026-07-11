import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitnfuel.app',
  appName: 'Fitness Fuel',
  webDir: 'dist',
  backgroundColor: '#0D0D18',
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      backgroundColor: '#0D0D18',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#0D0D18',
    },
  },
};

export default config;
