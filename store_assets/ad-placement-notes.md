# Ad Placement Reference - Used Car Check Pro

This document records where ads appear and where they do not appear in the app, for Play Console disclosure, AdMob policy compliance, and internal reference.

---

## Banner Ads

### Banner Ads ARE Shown On

| Screen | Tab / Location | Notes |
|---|---|---|
| Home screen | Home tab | Banner appears at the bottom of the screen below the main content |
| Saved Inspections screen | Saved tab | Banner appears at the bottom of the saved inspections list |
| Compare Select screen | Compare tab | Banner appears at the bottom of the vehicle selection screen |

### Banner Ads Are NOT Shown On

| Screen | Reason |
|---|---|
| Vehicle Details form (new inspection) | Active data entry - user is inputting inspection information |
| Checklist screens (all sections) | Active inspection workflow - user is performing a vehicle inspection |
| Inspection Summary screen | User is reviewing findings before saving |
| Compare Result screen | User is reviewing side-by-side comparison results |
| Settings screen | Settings and configuration screen |
| Privacy Policy screen | Legal and informational screen |
| Onboarding screen | First-time user setup screen |
| Any modal or confirmation dialog | Dialogs are overlaid on existing screens |

---

## Interstitial Ads

### Interstitial Ads ARE Shown

| Trigger | Condition |
|---|---|
| User taps "Return to Home" after completing and saving a new inspection | Only if frequency limits allow (see below) |

### Frequency Limits (both conditions must be true to show)

- Maximum once per app session: If an interstitial has already been shown in the current session, no more interstitials are shown regardless of actions taken
- Maximum once per rolling 24-hour period: If an interstitial was shown within the last 24 hours (tracked by timestamp on-device), no interstitial is shown

Logic implemented in: `src/config/admob.ts` - `canShowInterstitial()` function

### Interstitial Ads Are NEVER Shown In These Situations

| Situation | Reason |
|---|---|
| During an active inspection (any checklist screen) | User is actively using core functionality |
| Before saving inspection data | Data must be saved before any ad can appear |
| Before the user can view their own inspection summary | User must see their findings without interruption |
| Before exporting a PDF or JSON file | Export operations must complete without interruption |
| During deletion or data reset flows | Destructive operations must not be interrupted |
| On app launch or first open | User should enter the app without an ad gate |
| During navigation without user-initiated action | No ad appears unless the user specifically taps "Return to Home" after saving |
| When frequency limits have been reached | Logic enforced in canShowInterstitial() |

---

## AdMob Policy Compliance Notes

This placement strategy is designed to comply with Google AdMob policies:

1. Ads do not appear within the active inspection workflow, consistent with the policy against ads that interfere with core functionality
2. Interstitials are triggered only by user navigation actions, not by timers or automated triggers
3. Interstitial frequency is limited to protect user experience and comply with Google's guidance on interstitial frequency
4. Banner ads are placed at the bottom of screens in standard positions and do not overlap content or controls
5. No ads appear on screens where users are actively entering data or reviewing safety-critical inspection information

---

## Declaration for Play Console Content Rating and Ads

When completing the Play Console content rating questionnaire or any ads disclosure:

- Ad type: Banner and Interstitial
- Ad network: Google AdMob
- Ads are not targeted to children
- Ads do not contain adult content, violence, or gambling
- Ad content is controlled by Google AdMob's policies and targeting settings in the AdMob console
