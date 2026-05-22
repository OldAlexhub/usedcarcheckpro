import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MobileAds, { RequestConfiguration } from 'react-native-google-mobile-ads';
import { StorageService } from './src/storage/storage';
import { AppSettings } from './src/types';
import AppNavigator from './src/navigation/AppNavigator';

const DEFAULT_SETTINGS: AppSettings = {
  hasCompletedOnboarding: false,
  lastInterstitialShownDate: null,
  interstitialShownThisSession: false,
};

function App(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'MainTabs'>('Onboarding');

  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      try {
        // Initialize Mobile Ads SDK
        if (__DEV__) {
          const requestConfig: RequestConfiguration = {
            testDeviceIdentifiers: ['EMULATOR'],
          };
          await MobileAds().setRequestConfiguration(requestConfig);
        }
        await MobileAds().initialize();
      } catch {
        // Ad SDK init failure is non-fatal
      }

      try {
        const loadedSettings = await StorageService.getSettings();

        // Reset per-session flag on each app launch
        const sessionSettings: AppSettings = {
          ...loadedSettings,
          interstitialShownThisSession: false,
        };
        await StorageService.saveSettings(sessionSettings);

        if (isMounted) {
          setSettings(sessionSettings);
          setInitialRoute(
            sessionSettings.hasCompletedOnboarding ? 'MainTabs' : 'Onboarding',
          );
        }
      } catch {
        if (isMounted) {
          setSettings(DEFAULT_SETTINGS);
          setInitialRoute('Onboarding');
        }
      }
    }

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  if (settings === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1D21' }}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1D21" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1A1D21" />
        <AppNavigator initialRoute={initialRoute} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
