# AdMob Setup Notes - Used Car Check Pro

## AdMob Identifiers

| Item | ID |
|---|---|
| AdMob Publisher ID | pub-7831002909037560 |
| AdMob App ID | ca-app-pub-7831002909037560~9160533701 |
| Banner Ad Unit ID | ca-app-pub-7831002909037560/1263382299 |
| Interstitial Ad Unit ID | ca-app-pub-7831002909037560/2251967276 |

---

## Test Ad Unit IDs (for debug builds)

Google provides standard test ad unit IDs that are safe to use during development. These are configured in `src/config/admob.ts` and are automatically used when `__DEV__` is true.

| Ad Type | Test ID |
|---|---|
| Banner | ca-app-pub-3940256099942544/6300978111 |
| Interstitial | ca-app-pub-3940256099942544/1033173712 |

The `src/config/admob.ts` file automatically switches between test IDs (debug builds) and production IDs (release builds) using the `__DEV__` flag. No manual changes are needed when building for release.

---

## Ad Placement Summary

### Banner Ads

- Shown on: Home screen, Saved Inspections screen, Compare Select screen
- Not shown on: Checklist screens, Vehicle Details form, Inspection Summary, Compare Result, Settings, Privacy Policy
- Implementation: `BannerAdWrapper` component wraps the AdMob banner and handles load state

### Interstitial Ads

- Shown: Once, when user taps "Return to Home" after completing and saving a new inspection
- Maximum frequency: Once per app session AND once per rolling 24-hour period
- Never shown: During an inspection, before saving, before exporting, during deletion flows, on app launch, or without a user-initiated navigation action
- Frequency logic is implemented in `src/config/admob.ts` via `canShowInterstitial()` and `updateInterstitialShown()`

---

## Steps to Link Your App in AdMob Console

1. Sign in to AdMob at https://admob.google.com
2. Navigate to Apps in the left menu
3. Click "Add app"
4. Select "Android" as the platform
5. If your app is already published: search for it by package name (com.oldalexhub.usedcarcheckpro)
6. If not yet published: select "No, the app is not published yet" and enter the app name manually
7. Complete the app setup wizard
8. Note your App ID (ca-app-pub-7831002909037560~9160533701) - this must match what is in your AndroidManifest.xml under the `com.google.android.gms.ads.APPLICATION_ID` meta-data tag

### Verify AndroidManifest.xml

In `android/app/src/main/AndroidManifest.xml`, confirm this meta-data entry is present inside the `<application>` tag:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-7831002909037560~9160533701"/>
```

---

## Steps to Verify Ads Are Showing

1. Build a debug APK and install on a physical Android device (ads may not render correctly on emulators)
2. Open the app and navigate to the Home screen - a test banner ad should appear at the bottom
3. Navigate to the Saved Inspections tab - a test banner should appear there as well
4. Navigate to the Compare tab - a test banner should appear there as well
5. Complete a new inspection from start to finish, save it, and tap "Return to Home" - a test interstitial should appear
6. Verify the interstitial does NOT show again in the same session by completing another inspection and tapping "Return to Home" a second time

For release builds, use a physical device and wait a few minutes after first launch for live ads to begin serving.

---

## Ad Review Period

After your first release, Google AdMob requires a review period before live ads begin serving. During this period:

- The app will show no ads or limited ads
- This typically takes 1 to 3 business days after the app is published on Google Play
- Do not test with your own production build and tap ads repeatedly - this violates AdMob policies
- Monitor your AdMob dashboard for the app status to change from "Pending" to "Ready"

---

## Troubleshooting Common Issues

**Ads not showing in debug builds:**
- Confirm you are using the test ad unit IDs (not production IDs) for debug builds
- Test IDs are configured automatically in `src/config/admob.ts` when `__DEV__` is true
- Ensure you have internet connectivity on the test device

**App crashing on startup with AdMob error:**
- Verify the App ID meta-data in AndroidManifest.xml is correct
- Confirm `react-native-google-mobile-ads` is properly linked in the build

**Ads not showing after release:**
- Wait for the AdMob review period to complete (1 to 3 business days)
- Verify your AdMob account is active and in good standing
- Check the AdMob dashboard for any policy violations or flags on the app

**app-ads.txt warnings in AdMob:**
- Host the app-ads.txt file at your developer website root (see app-ads-txt-notes.md)
- Set your developer website URL in the Play Console developer settings
- Allow 24 to 48 hours for Google's crawler to verify the file
