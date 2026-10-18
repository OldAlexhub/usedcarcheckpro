# Privacy Policy - Used Car Check Pro

**Last updated: October 18, 2026**

## 1. Overview

Used Car Check Pro ("the app") is a free Android application developed by Old Alex Hub. This policy explains how the app handles information. The app is free to use and is supported by advertising provided by Google AdMob.

## 2. Information We Collect

Your complete inspection record remains stored locally on your device. After you accept the in-app data-use disclosure, the app sends Old Alex Hub a limited, pseudonymous inspection-outcomes record containing:

- Vehicle year, make, model, and trim
- Powertrain and seller category
- Odometer and asking-price ranges rather than exact values
- Checklist item identifiers and statuses
- Decision status
- Dataset schema version, app version, platform, and a random installation identifier

This dataset does **not** contain the VIN, vehicle nickname, listing URL, seller name or label, free-text notes, precise location, or photos. The collection API accepts a fixed schema and rejects extra fields. The app also sends a small set of allowlisted product events, such as inspection completion and report export, with bounded categorical and numeric properties. It does not send arbitrary event names or arbitrary event text.

If you enter a complete 17-character Vehicle Identification Number (VIN), the app sends that VIN to `proveh.server.oldalexhub.com` to validate it and obtain vehicle details. The Proveh server forwards the VIN to the U.S. National Highway Traffic Safety Administration (NHTSA) vehicle-data service. The Proveh cache stores a one-way SHA-256 hash of the VIN and the decoded vehicle attributes for up to 30 days; it does not store the raw VIN in the cache. The server and its infrastructure providers may temporarily process technical information such as IP address, request time, and error details for security and reliable operation.

**Google AdMob** is used to display advertisements in the app. AdMob may collect device identifiers, usage data, and ad interaction data as described in Google's Privacy Policy. This data is processed by Google according to their policies. Old Alex Hub does not receive or control this data.

## 3. Advertising

The app is free and supported by advertising. Google AdMob displays ads on selected screens:

- **Banner ads** appear persistently on the Home screen, Saved Inspections screen, Compare Vehicle Selection screen, and Compare Result screen.
- **Interstitial ads** (full-screen ads) may appear at natural break points:
  - After saving a new vehicle inspection
  - After pressing Finish at the end of the inspection checklist
  - After exporting a PDF report
  - Interstitial ads are subject to a one-hour cooldown — no more than one interstitial will be shown per hour.

AdMob may show personalized ads based on your Google account settings and device data. You can manage ad personalization in your Google account settings at myaccount.google.com.

For more information about how Google uses data when you use partner apps, visit:
google.com/policies/privacy/partners

## 4. Product Dataset and Your Inspection Data

Old Alex Hub uses the pseudonymous inspection-outcomes dataset and product events only for internal analysis, improving this product, and developing future features with open-source technology. No large language model (LLM) is used. We do not sell this dataset, license it to others, or share it for third-party marketing.

Inspection-outcomes records are retained for up to 1,825 days (five years). Product events are retained for up to 365 days. Retention is enforced by Proveh Server during ingestion. We may retain aggregated statistics that no longer identify an installation.

Your complete inspection—including exact price and odometer, VIN, seller details, listing URL, and written notes—remains local to your device. VIN lookup transmits only the VIN required for the lookup and does not attach that VIN to the inspection-outcomes dataset.

If you use the export or share feature, your data will be shared in the format you choose with the app you select. Old Alex Hub has no control over data you choose to export or share.

## 5. Internet Permission

The app requests the INTERNET permission. This permission is used solely for:

- Loading and displaying advertisements from Google AdMob
- Ad-related privacy messaging required by Google's Mobile Ads SDK
- Validating a VIN and retrieving decoded vehicle attributes from the Proveh server and NHTSA
- Securely delivering the limited inspection-outcomes dataset and allowlisted product events to Proveh Server

## 6. Permissions

The app requests only the INTERNET permission. It does not request and does not use:

- Camera or microphone
- Location
- Contacts
- Phone state
- Storage or media access
- Any other sensitive permissions

## 7. Data Deletion

You can delete locally stored and collected product data at any time:

- **In-app**: Go to Settings and tap "Clear All Data." This deletes local inspections and sends an authenticated deletion request for dataset records and product events associated with the random installation identifier.
- **Individual records**: Delete any inspection from the Saved Inspections screen
- **Android settings**: Go to Android Settings, Apps, Used Car Check Pro, Storage, and clear app data

If the device is offline when you clear data, the server deletion is queued and new collection pauses until that deletion completes. Clearing Android app storage directly cannot send this server request, so use the in-app action first when possible. You may also contact us at the address below for assistance.

VIN cache entries expire automatically after 30 days. Because the cache key is a one-way VIN hash and is not associated with the random installation identifier, it is removed through expiry rather than the installation-deletion request.

## 8. Children's Privacy

The app is not directed at children under 13. We do not knowingly collect information from children under 13.

## 9. Changes to This Policy

We may update this policy from time to time. Continued use of the app after changes constitutes acceptance of the updated policy.

## 10. Contact

For questions about this privacy policy, contact:

Email: info@oldalexhub.com
Developer: Old Alex Hub

---

*Used Car Check Pro is an organization and observation tool only. It does not replace a professional mechanical inspection, vehicle history report, title check, recall check, or independent safety evaluation.*
