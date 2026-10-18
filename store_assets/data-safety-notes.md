# Google Play Data Safety Notes

Package: `com.oldalexhub.usedcarcheckpro`

These notes describe the app after Proveh Server dataset collection is enabled. Re-check the current Google Play form and the current Google Mobile Ads SDK disclosure before submitting; Google can change its categories and SDK guidance.

## Top-level answers

| Question | Answer |
|---|---|
| Does the app collect or share required data types? | Yes |
| Is developer-collected data encrypted in transit? | Yes, HTTPS |
| Can users request deletion? | Yes, Settings > Clear All Data |
| Is an account required? | No |

## Developer-collected data

### App activity / other user-generated content

**Collected: Yes. Shared: No, except the VIN transfer described below.**

The first-party inspection-outcomes dataset contains vehicle year, make, model and trim; powertrain; seller category; odometer and asking-price ranges; checklist item statuses; and decision status. It excludes VIN, nickname, listing URL, seller name or label, free-text notes, exact price and odometer, precise location, and photos.

- Purpose: Analytics and product improvement; future app functionality using open-source technology
- Processing: Retained, pseudonymous
- Retention: Up to 1,825 days
- Required or optional: Required after the user accepts the prominent onboarding disclosure

The app also collects allowlisted interaction events such as app open, inspection start/completion, VIN lookup result, comparison creation, and report export. Event properties are bounded by a server allowlist and do not accept arbitrary text.

- Purpose: Analytics and product improvement
- Processing: Retained, pseudonymous
- Retention: Up to 365 days

### Device or other IDs

**Collected: Yes. Shared by Old Alex Hub: No.**

Proveh Server issues a random installation identifier and secret. It is not the Android advertising ID, hardware ID, phone number, email address, or account ID. It is used for authenticated ingestion, duplicate prevention, cohort counts, and deletion. Treat it as a Device or other ID in the Play form to avoid under-disclosure.

### VIN lookup

A VIN entered by the user is transmitted to Proveh Server and the U.S. NHTSA vehicle-data API for app functionality. Treat this conservatively as other user-generated content that is collected and transferred to a third-party service for functionality. The Proveh cache stores a one-way VIN hash and decoded vehicle attributes for up to 30 days, not the raw VIN. The VIN is never joined to the inspection-outcomes dataset.

## Data not collected by Old Alex Hub

- Name, email address, phone number, postal address, or contacts
- Precise or approximate location
- Health, fitness, payment, credit, or authentication information
- Messages, audio, photos, videos, files, calendar, or browsing history
- Crash logs or diagnostics beyond transient server security and reliability logs
- Free-text inspection notes, seller names, or listing URLs

## Data sharing

The Old Alex Hub product dataset is not sold, licensed, or shared for third-party marketing. Separate service transfers still need accurate Play disclosures:

- NHTSA receives a VIN only when the user invokes VIN lookup, for app functionality.
- Google AdMob may collect and share advertising identifiers, IP address, app interactions, diagnostics, and ad interaction data for advertising, fraud prevention, analytics, and related purposes. Complete the Play form using Google's current Mobile Ads SDK guidance.
- Hosting and network providers may process encrypted traffic and limited operational logs as service providers.

## Deletion

Settings > Clear All Data:

1. Deletes local inspections and settings.
2. Uses the anonymous installation secret to delete that installation's inspection-outcomes records and product events from Proveh Server.
3. If offline, queues the server deletion and pauses new collection until it succeeds.

Clearing Android app storage directly cannot transmit a deletion request, so the privacy policy tells users to use the in-app action first. VIN cache entries expire after 30 days because their one-way keys are not linked to the installation identifier.

## Security

- All app/server traffic uses HTTPS in production.
- Dataset and event endpoints require an unguessable installation ID and bearer secret.
- The database is not exposed publicly by the supplied Nexus deployment.
- Admin passwords are Argon2-hashed and the portal uses secure, signed, strict cookies and CSRF protection.
