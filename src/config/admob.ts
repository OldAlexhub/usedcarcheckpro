import { AppSettings } from '../types';

const IS_DEV = __DEV__;

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const PROD_BANNER_ID = 'ca-app-pub-7831002909037560/1263382299';
const PROD_INTERSTITIAL_ID = 'ca-app-pub-7831002909037560/2251967276';

export const ADMOB_BANNER_ID = IS_DEV ? TEST_BANNER_ID : PROD_BANNER_ID;
export const ADMOB_INTERSTITIAL_ID = IS_DEV ? TEST_INTERSTITIAL_ID : PROD_INTERSTITIAL_ID;

// Returns true if an interstitial can be shown (max once per session, max once per 24h)
export function canShowInterstitial(settings: AppSettings): boolean {
  if (settings.interstitialShownThisSession) return false;
  if (!settings.lastInterstitialShownDate) return true;
  const last = new Date(settings.lastInterstitialShownDate).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return now - last > twentyFourHours;
}

// Returns updated settings after showing an interstitial
export function updateInterstitialShown(settings: AppSettings): AppSettings {
  return {
    ...settings,
    lastInterstitialShownDate: new Date().toISOString(),
    interstitialShownThisSession: true,
  };
}
