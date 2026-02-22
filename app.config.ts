const getAppName = () => {
  if (process.env.APP_VARIANT === 'production') return 'Kairo';
  if (process.env.APP_VARIANT === 'development') return 'Kairo (Dev)';
  if (process.env.APP_VARIANT === 'preview') return 'Kairo (Preview)';
};

const getBundleIdentifier = () => {
  if (process.env.APP_VARIANT === 'production') return 'com.yashsrivasta7a.kairo';
  if (process.env.APP_VARIANT === 'development') return 'com.yashsrivasta7a.kairo.dev';
  if (process.env.APP_VARIANT === 'preview') return 'com.yashsrivasta7a.kairo.preview';
};

const appName = getAppName();
const bundleIdentifier = getBundleIdentifier();

export default {
  expo: {
    name: appName,
    slug: 'Kairo',
    scheme: 'Kairo',
    version: '1.0.0',
    web: {
      output: 'server',
      favicon: './assets/favicon.png',
    },
    experiments: {
      tsconfigPaths: true,
    },
    plugins: ['expo-router'],
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier: bundleIdentifier,
      supportsTablet: false,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: bundleIdentifier,
    },
    extra: {
      eas: {
        projectId: '2d800b3c-bd25-4232-ab2c-1848c240e58b',
      },
    },
    owner: 'yashsrivasta7a',
  },
};
