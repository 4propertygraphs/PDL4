import { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: 'PDL',
  slug: 'pdl-mobile',
  scheme: 'pdlmobile',
  orientation: 'portrait',
  ios: {
    bundleIdentifier: 'com.pdl.mobile',
    supportsTablet: true,
  },
  android: {
    package: 'com.pdl.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  plugins: [],
};

export default config;
