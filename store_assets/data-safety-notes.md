# Data Safety Section - Google Play Console

This document provides answers for all fields in the Google Play Data Safety form for Used Car Check Pro (com.oldalexhub.usedcarcheckpro).

---

## Section 1: Data Collection and Security

### Does your app collect or share any of the required user data types?

**Answer: No** - The developer does not collect any user data.

Note: Google AdMob (a third-party SDK included in the app) may collect advertising-related data such as advertising ID, IP address, and usage data. This is governed by Google's own privacy policies, not the developer's. Because AdMob is present, you must still disclose its data practices in the Data Safety form.

### Is all of the user data collected by your app encrypted in transit?

**Answer: Not applicable** - The developer does not transmit any user data. All inspection data is stored locally on the device only. The AdMob SDK transmits ad-related data over encrypted connections as governed by Google's policies.

### Do you provide a way for users to request that their data is deleted?

**Answer: Yes** - Users can delete individual inspection records from within the app. Users can also delete all app data (clearing all locally stored inspections and settings) through the Android system: Settings > Apps > Used Car Check Pro > Storage > Clear Data. No request to the developer is needed because no user data exists outside the device.

---

## Section 2: Data Types Collected

### Personal info (name, email, address, etc.)

**Collected: No**

### Financial info (payment details, etc.)

**Collected: No**

### Health and fitness

**Collected: No**

### Messages

**Collected: No**

### Photos and videos

**Collected: No**

### Audio files

**Collected: No**

### Files and docs

**Collected: No**

### Calendar

**Collected: No**

### Contacts

**Collected: No**

### App activity (app interactions, in-app search history, installed apps, etc.)

**Collected by developer: No**
**Collected by AdMob: Yes** - AdMob may collect app interaction data for ad serving and measurement. This is governed by Google's privacy policies.

### Web browsing

**Collected: No**

### App info and performance (crash logs, diagnostics, etc.)

**Collected by developer: No**

### Device or other IDs (advertising ID, device ID, etc.)

**Collected by developer: No**
**Collected by AdMob: Yes** - AdMob may use the Android Advertising ID for ad personalization and measurement purposes.

---

## Section 3: Data Sharing

### Do you share any of the collected user data with third parties?

**Answer: No** - The developer does not share any user data with third parties because the developer does not collect any user data.

Note: Google AdMob may share advertising-related data (such as advertising ID and ad interaction data) with Google and its advertising partners as part of its normal operation. This is governed by Google's policies.

---

## Section 4: Security Practices

### Does your app use security measures such as data encryption?

**Answer: Not applicable for developer data.** All inspection data resides in local device storage (AsyncStorage). The developer does not transmit data and therefore has no data in transit to encrypt. Android platform encryption protects on-device storage.

### Does your app follow the Families Policy?

**Answer: No** - This app is not directed at children and does not target the Families audience. Content rating is Everyone, but the app's subject matter (used vehicle purchase inspection) is intended for adult users.

---

## Section 5: AdMob Disclosure Guidance

Because the app integrates Google AdMob (react-native-google-mobile-ads), you must complete the Data Safety form to reflect AdMob's data practices. Google provides a pre-filled Data Safety guidance document for apps using AdMob. Reference:

https://support.google.com/googleplay/android-developer/answer/10787469

Follow the guidance there to correctly attribute AdMob's data collection to the Data Safety form. The key entries AdMob typically requires:

- Device or other IDs: Collected, Shared with third parties, for Advertising or marketing purposes, not ephemeral
- App activity: May be collected depending on consent status and configuration

---

## Summary for Play Console Entry

| Field | Answer |
|---|---|
| Developer collects user data | No |
| AdMob collects ad-related data | Yes (per Google's policies) |
| Data encrypted in transit by developer | Not applicable |
| User can request data deletion | Yes (via in-app delete or Android app settings) |
| Data shared by developer | No |
| App follows Families Policy | No |
