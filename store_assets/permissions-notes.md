# App Permissions - Used Car Check Pro

## Permissions Declared

Used Car Check Pro declares exactly one permission:

```
android.permission.INTERNET
```

This is the only permission in the app's AndroidManifest.xml.

---

## Why INTERNET Permission Is Required

The INTERNET permission is required for Google AdMob, optional VIN lookup through Proveh Server and NHTSA, and secure delivery of the disclosed product-improvement dataset and allowlisted events to Proveh Server.

Complete inspection records remain local in AsyncStorage, and PDF/JSON generation happens on-device. A limited pseudonymous outcome record is transmitted after disclosure acceptance; VINs, seller names, listing URLs, notes, precise location, and photos are excluded. See the Privacy Policy and data-safety notes.

---

## Permissions Not Requested

The following permissions are explicitly NOT requested by this app:

| Permission | Why Not Needed |
|---|---|
| CAMERA | The app does not capture photos or use the camera in any way |
| READ_EXTERNAL_STORAGE | The app does not read files from device storage |
| WRITE_EXTERNAL_STORAGE | PDF and JSON files are written to the app's own cache directory, not shared external storage. Android share functionality handles sharing without this permission |
| ACCESS_FINE_LOCATION | The app does not use GPS or location in any way |
| ACCESS_COARSE_LOCATION | The app does not use location in any way |
| READ_CONTACTS | The app does not access contacts |
| READ_PHONE_STATE | The app does not access phone state or device identifiers |
| RECORD_AUDIO | The app does not record audio or use the microphone |
| BLUETOOTH | The app does not use Bluetooth |
| READ_CALL_LOG | The app does not access call logs |
| RECEIVE_SMS | The app does not receive SMS messages |

---

## What This Means for Privacy

Requesting only the INTERNET permission means:

- The app cannot access the camera and cannot take or store photos
- The app cannot access GPS coordinates or track movement
- The app cannot read or write to shared device storage beyond its own private app directory
- The app cannot read contacts, call logs, or other personal information from the device
- The app cannot identify the device beyond what AdMob uses for advertising (advertising ID, which is governed by Google's policies and can be reset or opted out by the user)

This minimal permission footprint reflects the app's offline-first design. Core inspection features are local; advertising, VIN lookup, and disclosed dataset delivery use the network.

---

## For Google Play Data Safety Form

When completing the Data Safety form in the Play Console:

- Location data: Not collected
- Contacts: Not collected
- Camera: Not accessed
- Microphone: Not accessed
- Storage: App only uses its own private storage directory, not shared external storage

Disclose Old Alex Hub's pseudonymous product dataset, the VIN transfer to Proveh Server/NHTSA, and AdMob's current data practices as documented in `data-safety-notes.md`.
