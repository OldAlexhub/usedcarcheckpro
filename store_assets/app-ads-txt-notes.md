# app-ads.txt Configuration Notes

## What app-ads.txt Is

app-ads.txt (Authorized Digital Sellers for apps) is an IAB Tech Lab standard that lets you declare which ad networks are authorized to sell advertising inventory in your app. It helps prevent ad fraud and unauthorized ad serving. Google requires it for AdMob publishers and it can affect your ad revenue if not configured correctly.

---

## Your app-ads.txt Content

The file must contain exactly this line:

```
google.com, pub-7831002909037560, DIRECT, f08c47fec0942fa0
```

- `google.com` - the advertising system domain
- `pub-7831002909037560` - your AdMob publisher ID
- `DIRECT` - indicates you have a direct relationship with Google (not a reseller)
- `f08c47fec0942fa0` - Google's TAG Certified Against Fraud identifier

The file `app-ads.txt` with exactly this content is included in the root of this repository.

---

## Where to Host It

The app-ads.txt file must be hosted at the root of your developer website domain. Google Play uses the developer website URL you set in the Play Console to locate this file.

If your developer website is `https://oldalexhub.github.io`, host the file at:

```
https://oldalexhub.github.io/app-ads.txt
```

If you use a custom domain such as `https://oldalexhub.com`, host it at:

```
https://oldalexhub.com/app-ads.txt
```

The file must be served as plain text (Content-Type: text/plain). If you host your developer website on GitHub Pages, simply place the `app-ads.txt` file in the root of your GitHub Pages repository and it will be accessible at the correct URL automatically.

---

## How to Register Your Developer Website in Play Console

1. Open Google Play Console: https://play.google.com/console
2. Select your developer account (not a specific app)
3. Go to: Setup > Developer information (or "Developer page" settings)
4. Enter your developer website URL in the "Website" field
5. Save changes

Google's crawlers will then look for `app-ads.txt` at `[your-developer-website]/app-ads.txt` within a few days.

---

## How to Verify It Is Working

1. After hosting the file, visit the URL directly in a browser to confirm it returns the plain text content
2. In AdMob console: Apps > your app > App settings - there may be a status indicator
3. You can also use Google's app-ads.txt validator tool at:
   https://developers.google.com/ad-manager/tag/app-ads-txt-validator

Allow up to 24 to 48 hours for Google's crawler to pick up the file after initial setup.

---

## Why It Matters

Without a valid app-ads.txt file hosted at your developer website, some demand sources may not be able to bid on your ad inventory, which can reduce your ad revenue. It also signals to advertisers that your app is a legitimate, fraud-protected inventory source, which can improve advertiser confidence and CPM rates over time.
