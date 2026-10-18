# Google Play Console Submission Checklist - Used Car Check Pro

Use this checklist to verify all required steps are complete before and during submission.

---

## App Bundle

- [ ] Android App Bundle (AAB) built in release mode using `release.py` or Gradle
- [ ] AAB is signed with the release keystore (not the debug keystore)
- [ ] Version code incremented from previous release (for first release: versionCode = 1)
- [ ] Version name is set correctly (for first release: versionName = "1.0.0")
- [ ] AAB has been tested on a physical device in release mode before upload
- [ ] File size is reasonable - review if over 100 MB

---

## Store Listing

- [ ] App title entered: "Used Car Check Pro: Buyer Guide" (30 characters max - verify this fits)
- [ ] Short description entered (80 characters max) - use content from `short-description.txt`
- [ ] Full description entered (4000 characters max) - use content from `full-description.txt`
- [ ] Promotional text entered (170 characters max) - use content from `promo-text.txt`
- [ ] App icon uploaded: 512 x 512 px, PNG, 32-bit with alpha
- [ ] Feature graphic uploaded: 1024 x 500 px, PNG or JPEG (see `feature-graphic-notes.md`)
- [ ] At least 2 phone screenshots uploaded (recommended: 8 screenshots)
- [ ] Screenshot captions added - use content from `screenshot-captions.txt`
- [ ] App category set to: Auto and Vehicles
- [ ] App tags / keywords added if prompted (used car, car inspection, vehicle checklist, car buying, used car checker)

---

## Content Rating

- [ ] Content rating questionnaire completed
- [ ] All violence / adult content / gambling questions answered "No" or "Does not apply"
- [ ] Final content rating received: Everyone (E)
- [ ] Rating applied to all selected countries/regions

---

## Target Audience and Content

- [ ] Target age group set to: 18 and over (or "All ages" if prompted - the app has no age-restricted content but the subject matter is for adults)
- [ ] App does not appeal primarily to children confirmed
- [ ] "Does your app include ads?" answered: Yes
- [ ] Ad type disclosed: Banner, Interstitial

---

## Data Safety Section

- [ ] Data Safety form completed - reference `data-safety-notes.md` for all field answers
- [ ] "Does your app collect or share user data?" answered Yes for the first-party dataset, VIN lookup, and AdMob practices described in `data-safety-notes.md`
- [ ] AdMob data practices disclosed as required by Google
- [ ] Data deletion method described: use in-app Clear All Data to delete local and authenticated server records
- [ ] Form submitted and confirmed

---

## Privacy Policy

- [ ] Privacy policy written and finalized (see `PRIVACYPOLICY.md` in project root)
- [ ] Privacy policy hosted at a publicly accessible URL
- [ ] Privacy policy URL entered in Play Console store listing
- [ ] Privacy policy URL is accessible without login or authentication
- [ ] Privacy policy URL added to the app's in-app Privacy Policy screen as well

---

## App Category and Contact Details

- [ ] App category: Auto and Vehicles
- [ ] Developer contact email entered: mohamedgad.gm@gmail.com
- [ ] Developer website URL entered (used for app-ads.txt lookup)
- [ ] Developer physical address entered if required by Play Console

---

## Release Notes

- [ ] Release notes (What's New) entered for version 1.0.0 - use content from `release-notes.txt`
- [ ] Release notes are under 500 characters
- [ ] Release notes are in all languages you are targeting (English at minimum)

---

## Pricing and Distribution

- [ ] Pricing set to: Free
- [ ] Countries and regions selected (all countries recommended for maximum reach)
- [ ] Distribution to: Android phones and tablets (Android TV and Wear OS not applicable)
- [ ] Confirm app does not contain content that restricts distribution to specific regions

---

## AdMob Integration Verified

- [ ] AdMob App ID (ca-app-pub-7831002909037560~9160533701) is in AndroidManifest.xml
- [ ] Banner ads verified working in debug build on physical device
- [ ] Interstitial ad verified working in debug build on physical device
- [ ] Interstitial frequency limits (once per session, once per 24h) verified
- [ ] No ads appear during checklist screens or data operations
- [ ] app-ads.txt file hosted at developer website root
- [ ] Developer website URL set in Play Console
- [ ] AdMob account is active and app is linked in AdMob console

---

## Permissions Declared

- [ ] Only INTERNET permission is declared in AndroidManifest.xml
- [ ] No other permissions are requested or declared
- [ ] Confirm: no camera, no location, no microphone, no storage, no contacts, no phone state
- [ ] INTERNET permission justification: required for Google AdMob advertising (see `permissions-notes.md`)

---

## Signing Configuration

- [ ] Release keystore is created and securely backed up
- [ ] Keystore password and key alias are documented and stored securely
- [ ] `android/app/build.gradle` signingConfig is configured for release
- [ ] Google Play App Signing is enabled in Play Console (recommended - Google manages the signing key)
- [ ] Upload key certificate registered with Play Console if using Google Play App Signing

---

## Testing Verification

- [ ] App installed and tested on a physical Android device (not just emulator)
- [ ] All 4 powertrain types tested: Gasoline, Diesel, Hybrid, Electric
- [ ] Full inspection flow completed end to end (vehicle details, checklist, summary, save)
- [ ] PDF export tested and verified to open correctly
- [ ] JSON export tested and verified
- [ ] Share functionality tested
- [ ] Compare feature tested with 3 inspections
- [ ] Onboarding screen verified for first-time launch
- [ ] Settings screen verified
- [ ] Privacy Policy screen verified
- [ ] App tested on Android 8.0 (API 26) or the minimum API version set in build.gradle
- [ ] App tested on a recent Android version (Android 14 or 15)

---

## Pre-Launch Report

- [ ] AAB uploaded to Play Console internal testing track first
- [ ] Pre-launch report generated by Google (takes a few hours after AAB upload)
- [ ] Pre-launch report reviewed for any crashes or accessibility issues
- [ ] Any critical issues from pre-launch report addressed before moving to production
- [ ] App tested by at least one internal tester via internal testing track

---

## Final Steps Before Production Release

- [ ] All checklist items above are complete
- [ ] Store listing reviewed and proofread one final time
- [ ] Screenshots are high quality and accurately represent the app
- [ ] Privacy policy URL is live and accessible
- [ ] app-ads.txt is hosted and verified
- [ ] AdMob account has no policy violations
- [ ] Submit for review via Play Console
- [ ] Monitor Play Console for review status (typically 1 to 3 business days for new apps)
