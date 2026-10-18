/* global jest */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: React.createContext(insets),
    SafeAreaFrameContext: React.createContext(frame),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { frame, insets },
  };
});

jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');

jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MobileAds = () => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    setRequestConfiguration: jest.fn().mockResolvedValue(undefined),
  });

  return {
    __esModule: true,
    default: MobileAds,
    BannerAd: props => React.createElement(View, props),
    BannerAdSize: { BANNER: 'BANNER' },
    AdEventType: { LOADED: 'loaded', ERROR: 'error' },
    InterstitialAd: {
      createForAdRequest: jest.fn(() => ({
        addAdEventListener: jest.fn(() => jest.fn()),
        load: jest.fn(),
        show: jest.fn(),
      })),
    },
  };
});

jest.mock('react-native-html-to-pdf', () => ({
  convert: jest.fn().mockResolvedValue({ filePath: '/tmp/report.pdf' }),
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn().mockResolvedValue(undefined),
}));
