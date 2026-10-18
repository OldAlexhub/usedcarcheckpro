# Used Car Check Pro: Buyer Guide

**Inspect smarter before you buy.**

Used Car Check Pro is a free Android app that guides used-car buyers through a comprehensive, section-by-section inspection checklist. Record your findings, compare vehicles side by side, and export professional PDF reports - all offline and at no cost.

- Package: com.oldalexhub.usedcarcheckpro
- Developer: Old Alex Hub
- Platform: Android
- Category: Auto and Vehicles
- Monetization: Free with Google AdMob ads

---

## What the App Does

- **Guided inspection checklist** with 8 to 10 sections depending on powertrain type
- **Powertrain-specific sections** for Gasoline, Diesel, Hybrid, and Electric vehicles
- **Vehicle details entry**: year, make, model, trim, odometer, asking price, VIN, seller info, inspection date, and notes
- **Five item statuses** per checklist item: Good, Concern, Critical Attention, Not Checked, Not Applicable
- **Written notes** on any checklist item
- **Decision status tracking** with 6 options: Still Reviewing, Ask a Mechanic, Request More Info, Considering, Pass, Purchased
- **Save unlimited inspection records** locally on-device
- **Compare up to 3 vehicles** side by side with a summary of status counts and key details
- **Export PDF inspection reports** - full report per vehicle, generated on-device
- **Export PDF comparison reports** - side-by-side comparison PDF
- **Export JSON backup** of any inspection record
- **Android share integration** - share PDFs via email, messaging, or any share target
- **Offline-first core workflow** - checklist, saved inspections, comparison, and exports work without internet
- **Free with Google AdMob ads** - banner ads on Home, Saved, and Compare screens; interstitial ad after completing a new inspection (max once per session and once per 24 hours)
- **No account required** - no sign-in, no registration, no cloud sync
- **Automatic VIN lookup** - entering a complete VIN can fill vehicle details through the self-hosted Proveh API and NHTSA
- **Privacy-bounded dataset pipeline** - pseudonymous, versioned inspection outcomes are queued offline and delivered to the self-hosted Proveh API after disclosure acceptance

### Inspection Sections

| Section | Powertrain |
|---|---|
| Documents and Seller | All |
| Exterior and Body | All |
| Tires and Wheels | All |
| Interior and Controls | All |
| Startup and Idle | All |
| Engine - Gasoline and Hybrid ICE | Gasoline, Hybrid |
| Engine - Diesel | Diesel |
| Hybrid System | Hybrid |
| Electric System | Electric |
| Test Drive | All |
| Post-Drive Review | All |

---

## What the App Does NOT Do

- Does not replace a professional mechanical inspection
- Does not replace a vehicle history report (CARFAX, AutoCheck, etc.)
- Does not replace a title check or recall check
- Does not certify any vehicle as safe or roadworthy
- Does not confirm the absence of hidden defects
- Does not determine market value or recommend purchase
- Does not calculate safety scores, reliability scores, or deal scores
- Does not yet look up vehicle-specific open recalls
- Does not use the camera or take photos
- Does not use LLMs or proprietary hosted AI

Always consult a qualified mechanic and review all relevant records before making a purchase decision.

---

## Tech Stack

| Component | Version |
|---|---|
| React Native | 0.85.3 |
| React | 19.2.3 |
| TypeScript | 5.8.x |
| React Navigation (Stack + Bottom Tabs) | 7.x |
| AsyncStorage | 2.x |
| react-native-google-mobile-ads | 14.7.x |
| react-native-html-to-pdf | 0.12.x |
| react-native-fs | 2.20.x |
| react-native-share | 10.x |
| react-native-vector-icons | 10.x |
| react-native-gesture-handler | 2.x |
| react-native-screens | 4.x |
| react-native-safe-area-context | 5.x |

---

## Project Structure

```
usedcarcheckpro/
  android/               - Android native project
  src/
    components/          - Reusable UI components
      BannerAdWrapper    - AdMob banner ad component
      ChecklistItemRow   - Checklist item with status picker
      ConfirmDialog      - Confirmation modal
      EmptyState         - Empty list placeholder
      ProgressBar        - Section progress indicator
      StatusBadge        - Color-coded status pill
      VehicleCard        - Saved inspection summary card
    config/
      admob.ts           - AdMob ad unit IDs and frequency logic
      constants.ts       - App-wide constants
      theme.ts           - Colors, typography, spacing
    data/
      checklist.ts       - Full checklist template with all sections and items
    navigation/
      AppNavigator.tsx   - Stack + bottom tab navigation setup
    screens/
      ChecklistScreen    - Section-by-section checklist UI
      CompareResultScreen - Side-by-side comparison results
      CompareSelectScreen - Select inspections to compare
      HomeScreen         - Main dashboard
      InspectionSummaryScreen - Post-checklist summary and save
      OnboardingScreen   - First-time launch welcome screen
      PrivacyPolicyScreen - In-app privacy policy
      SavedInspectionsScreen - Saved inspection list
      SettingsScreen     - App settings and data management
      VehicleDetailsScreen - New inspection vehicle details form
    storage/
      storage.ts         - AsyncStorage read/write operations
    services/
      dataCollection.ts  - Offline dataset/event queue and deletion flow
      serverApi.ts       - VIN lookup API client
    types/
      index.ts           - All TypeScript interfaces and type definitions
    utils/
      dateUtils.ts       - Date formatting helpers
      inspectionUtils.ts - Status counting and inspection helpers
      pdfExport.ts       - HTML-to-PDF generation for reports
      shareUtils.ts      - Android share and file export helpers
  store_assets/          - Play Store listing copy, notes, and documentation
  App.tsx                - App entry point
  server/                - Self-hosted FastAPI/PostgreSQL smart-services API
  app-ads.txt            - AdMob authorized sellers file (host at developer website root)
  PRIVACYPOLICY.md       - Full privacy policy
```

---

## Setup Instructions

### Prerequisites

- Node.js 22.11.0 or higher
- Android Studio with Android SDK
- Java 17 or higher
- React Native development environment configured per the [official setup guide](https://reactnative.dev/docs/set-up-your-environment)

### Install Dependencies

```sh
npm install
```

### Run in Development Mode

Start the Metro bundler:

```sh
npm start
```

In a separate terminal, build and run on a connected Android device or emulator:

```sh
npm run android
```

Debug builds automatically use Google's test ad unit IDs. You will see test ads, not live ads.

---

## Building a Release APK or AAB

### Using release.py (if present)

If a `release.py` script is included in the project root, run it from the project root:

```sh
python release.py
```

Follow the prompts to build a signed release AAB or APK.

### Manual Gradle Build

Navigate to the Android directory and build:

```sh
cd android
./gradlew bundleRelease
```

The output AAB will be at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

To build a release APK instead:

```sh
cd android
./gradlew assembleRelease
```

Output APK:

```
android/app/build/outputs/apk/release/app-release.apk
```

### Signing Configuration

Release signing is configured in `android/app/build.gradle` under `signingConfigs`. Ensure your keystore file and credentials are set up before building for release. Never commit keystore files or passwords to source control.

---

## AdMob Configuration

| Item | Value |
|---|---|
| AdMob Publisher ID | pub-7831002909037560 |
| AdMob App ID | ca-app-pub-7831002909037560~9160533701 |
| Banner Ad Unit ID | ca-app-pub-7831002909037560/1263382299 |
| Interstitial Ad Unit ID | ca-app-pub-7831002909037560/2251967276 |

Ad unit IDs are managed in `src/config/admob.ts`. Test IDs are used automatically in debug builds (`__DEV__ === true`). Production IDs are used automatically in release builds.

See `store_assets/admob-setup-notes.md` for full setup and verification instructions.

---

## Privacy

- Complete inspection records remain on-device using AsyncStorage
- A limited, pseudonymous dataset includes vehicle attributes, value ranges, checklist statuses, and decisions after disclosure acceptance
- VIN, nickname, seller name, listing URL, notes, precise location, and photos are excluded from the product dataset
- VIN lookup sends the VIN to Proveh Server and NHTSA; AdMob separately processes advertising data
- Settings can delete local data and authenticated server records for the anonymous installation
- Only the INTERNET permission is declared in AndroidManifest.xml
- See `PRIVACYPOLICY.md` for the complete privacy policy

---

## Store Assets

All Play Store listing copy, notes, and documentation are in the `store_assets/` directory:

| File | Contents |
|---|---|
| store-listing.md | All Play Store fields organized as a document |
| short-description.txt | 80-character short description |
| full-description.txt | Plain text full store description |
| promo-text.txt | 170-character promotional text |
| release-notes.txt | Version 1.0.0 release notes |
| screenshot-captions.txt | 8 screenshot captions |
| data-safety-notes.md | Data Safety form answers for Play Console |
| privacy-summary.txt | Brief privacy summary |
| feature-graphic-notes.md | Instructions for creating the 1024x500 feature graphic |
| app-ads-txt-notes.md | app-ads.txt hosting and configuration guide |
| admob-setup-notes.md | AdMob console setup and verification guide |
| play-console-checklist.md | Complete submission checklist for Play Console |
| permissions-notes.md | Permission justifications for Play Console |
| ad-placement-notes.md | Where ads appear and where they do not |
| disclaimer-notes.md | Full app disclaimer text |

---

## License

MIT License

Copyright (c) 2025 Old Alex Hub

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
