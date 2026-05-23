import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { AppSettings } from '../types';
import { StorageService } from '../storage/storage';

const IS_DEV = __DEV__;

const TEST_BANNER_ID       = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const PROD_BANNER_ID       = 'ca-app-pub-7831002909037560/1263382299';
const PROD_INTERSTITIAL_ID = 'ca-app-pub-7831002909037560/2251967276';

export const ADMOB_BANNER_ID       = IS_DEV ? TEST_BANNER_ID       : PROD_BANNER_ID;
export const ADMOB_INTERSTITIAL_ID = IS_DEV ? TEST_INTERSTITIAL_ID : PROD_INTERSTITIAL_ID;

const ONE_HOUR_MS = 60 * 60 * 1000;

export function canShowInterstitial(settings: AppSettings): boolean {
  if (!settings.lastInterstitialShownDate) return true;
  const last = new Date(settings.lastInterstitialShownDate).getTime();
  return Date.now() - last > ONE_HOUR_MS;
}

export function updateInterstitialShown(settings: AppSettings): AppSettings {
  return {
    ...settings,
    lastInterstitialShownDate: new Date().toISOString(),
    interstitialShownThisSession: true,
  };
}

// Loads settings, checks cooldown, shows ad, updates cooldown. Call and await at any trigger point.
export async function tryShowInterstitial(): Promise<void> {
  try {
    const settings = await StorageService.getSettings();
    if (!canShowInterstitial(settings)) return;

    const interstitial = InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_ID);
    await new Promise<void>((resolve) => {
      const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        unsubLoaded();
        interstitial.show();
        resolve();
      });
      const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
        unsubError();
        resolve();
      });
      interstitial.load();
    });

    const updated = updateInterstitialShown(settings);
    await StorageService.saveSettings(updated);
  } catch {
    // Ad failures are always silent
  }
}
