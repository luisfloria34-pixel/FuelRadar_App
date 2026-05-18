# FuelRadar — Build & Production Setup Guide

Complete checklist for TestFlight, App Store, and Google Play production builds.

---

## Audit Status (2026-05-17)

| Area | iOS | Android | Status |
|---|---|---|---|
| Splash screen asset | ✅ | ✅ | Fixed (was referencing missing splash-icon.png) |
| Push notifications (local) | ✅ | ✅ | Working — channels initialized at startup |
| Push notifications (remote) | ⚠️ Needs APNs key | ⚠️ Needs FCM | See §3 and §4 |
| Maps | ✅ Apple Maps | ⚠️ Needs API key | See §5 |
| Location permissions | ✅ | ✅ | Configured |
| Onboarding persistence | ✅ | ✅ | AsyncStorage |
| Favorites / Alerts | ✅ | ✅ | Supabase |
| Deep linking | ✅ | ✅ | scheme: fuelradar |
| EAS build config | ⚠️ | ⚠️ | Needs Team ID / App IDs |

---

## 1. Required Environment Variables

### Local development
Copy `frontend/.env.example` to `frontend/.env` — it already has the real Supabase values.

### EAS cloud builds (TestFlight / Play Store)
The Supabase env vars are embedded directly in `frontend/eas.json` under each build profile's `env` key.  
**This means all EAS builds automatically receive the correct Supabase URL and anon key — no manual step needed.**

If you ever rotate the Supabase anon key, update all four `env` blocks in `eas.json` (development, preview, simulator, production).

#### Alternative: EAS Environment Variables (if you prefer not to keep them in eas.json)
Remove the `env` sections from `eas.json` and set them via EAS CLI instead:

```bash
cd frontend

# Supabase URL (public — same for all environments)
npx eas-cli env:create \
  --environment production \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://jorjciajyaqzjuflxefv.supabase.co"

# Supabase Anon Key — copy from app.supabase.com → Settings → API → anon (public)
npx eas-cli env:create \
  --environment production \
  --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "YOUR_ANON_KEY_FROM_SUPABASE_DASHBOARD"
```

Repeat with `--environment preview` and `--environment development` for those profiles.

#### Supabase Edge Function secrets (set once per project — never in eas.json)
```bash
# TankerKönig API key — get from creativecommons.tankerkoenig.de
npx supabase secrets set TANKERKOENIG_API_KEY=YOUR_KEY --project-ref jorjciajyaqzjuflxefv
```

---

## 2. EAS Build — One-time Setup

```bash
cd frontend
npx eas login          # login with Expo account: swyone-project
npx eas build:configure
```

Fill in `eas.json` submit section:
```json
"ios": {
  "appleId": "natydesigner@outlook.com",
  "ascAppId": "YOUR_APP_STORE_CONNECT_NUMERIC_APP_ID",
  "appleTeamId": "YOUR_10_CHAR_TEAM_ID"
},
"android": {
  "serviceAccountKeyPath": "./google-play-service-account.json"
}
```

- **ascAppId**: Found in App Store Connect → My Apps → App Information → Apple ID
- **appleTeamId**: Found at developer.apple.com → Membership → Team ID
- **google-play-service-account.json**: Created in Google Play Console → Setup → API access

---

## 3. iOS Push Notifications (APNs)

### What's already done
- `aps-environment: production` entitlement in app.json
- Expo push notification handler configured
- `expo-notifications` plugin included
- EAS projectId: `b0739ace-fc56-4264-98d1-cd22d43d1535`

### What you need to do in Apple Developer Portal
1. Go to developer.apple.com → Certificates, Identifiers & Profiles
2. Select identifier `com.luishustler.fuelradar`
3. Enable **Push Notifications** capability
4. Create an **APNs Auth Key** (recommended over certificate):
   - Keys → + → Apple Push Notifications service (APNs)
   - Download the `.p8` key file (save it — can only download once)
   - Note the Key ID (10 chars)
5. Upload to Expo EAS:
   ```bash
   npx eas credentials --platform ios
   # Select: Push Notifications → Auth Key → Upload
   ```

### Expo Go limitation
- Push tokens CANNOT be obtained in Expo Go on Android SDK 53+
- Local notifications (demo alerts) DO work in Expo Go on both platforms
- To test real push: use `eas build --profile development`

---

## 4. Android Push Notifications (FCM)

### Problem: google-services.json is a template
The current `frontend/google-services.json` has placeholder values. Android FCM will not work until you replace it with a real Firebase project config.

### Steps to fix
1. Go to console.firebase.google.com
2. Create a new project (or use existing): `fuelradar-prod`
3. Add Android app with package name: `com.luishustler.fuelradar`
4. Download `google-services.json`
5. Replace `frontend/google-services.json` with the downloaded file
6. Commit and rebuild

### Firebase Cloud Messaging setup
1. In Firebase Console → Project Settings → Cloud Messaging
2. Copy the **Server Key** (for backend use) or use Firebase Admin SDK
3. Your Supabase Edge Function that sends push alerts needs this key:
   ```
   FCM_SERVER_KEY=YOUR_FCM_SERVER_KEY   # backend env var, not in frontend
   ```

### Expo Go on Android
- Expo Go SDK 53+ does NOT support remote push tokens on Android
- Use a Development Build: `eas build --profile development --platform android`

---

## 5. Google Maps API Key (Android)

### Why needed
`react-native-maps` uses Google Maps SDK on Android. Without a valid API key,
the map shows "This app is not authorized to use Google Maps SDK" and may not
render correctly in production.

### Steps
1. Go to console.cloud.google.com → APIs & Services → Credentials
2. Create an **API key**
3. Restrict it to: Android apps → package `com.luishustler.fuelradar`
4. Enable APIs: Maps SDK for Android, Geocoding API
5. Add to `frontend/app.json`:
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "YOUR_API_KEY_HERE"
       }
     }
   }
   ```
6. Add to `frontend/.env` as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` for reference

### Note
On iOS, the map uses OpenStreetMap tiles via `react-native-maps` `mapType="none"` + `UrlTile` (CartoDB dark tiles). No Google Maps key is required on iOS.

---

## 6. iOS Maps (Apple Maps / MapKit)

No API key required. The app uses `react-native-maps` with `mapType="none"` and renders CartoDB dark tiles as overlays. This works out of the box on iOS with no additional credentials.

---

## 7. Location Permissions

### iOS — already configured in app.json
```
NSLocationWhenInUseUsageDescription  ✅
NSLocationAlwaysUsageDescription     ✅ (for future background alerts)
```

### Android — already configured in app.json
```
ACCESS_FINE_LOCATION    ✅
ACCESS_COARSE_LOCATION  ✅
RECEIVE_BOOT_COMPLETED  ✅
VIBRATE                 ✅
SCHEDULE_EXACT_ALARM    ✅ (Android 12+)
USE_EXACT_ALARM         ✅ (Android 13+)
```

---

## 8. Build Commands

### Development build (device testing, push notifications)
```bash
cd frontend
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Preview build (internal distribution)
```bash
eas build --profile preview --platform all
```

### Production build (App Store / Play Store)
```bash
eas build --profile production --platform ios    # → .ipa for TestFlight
eas build --profile production --platform android # → .aab for Play Store
```

### Submit to stores
```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## 9. TestFlight Checklist

Before submitting to TestFlight:
- [x] `eas.json` production env — Supabase URL + anon key embedded ✅
- [ ] `eas.json` submit section — fill in `ascAppId` and `appleTeamId`
- [ ] APNs key uploaded to EAS
- [ ] Supabase Edge Functions deployed (`npx supabase functions deploy --project-ref jorjciajyaqzjuflxefv`)
- [ ] `TANKERKOENIG_API_KEY` secret set in Supabase
- [ ] Version number incremented in app.json
- [ ] Run: `eas build --profile production --platform ios`
- [ ] Run: `eas submit --platform ios --latest`

---

## 10. Google Play Checklist

Before submitting to Play Store:
- [x] `eas.json` production env — Supabase URL + anon key embedded ✅
- [ ] Real `google-services.json` in place (Firebase project for `com.luishustler.fuelradar`)
- [ ] Google Maps API key set in app.json `android.config.googleMaps.apiKey`
- [ ] `google-play-service-account.json` created
- [ ] `eas.json` service account path filled in
- [ ] Supabase Edge Functions deployed
- [ ] `TANKERKOENIG_API_KEY` secret set in Supabase
- [ ] Version incremented
- [ ] Run: `eas build --profile production --platform android`
- [ ] Run: `eas submit --platform android --latest`

---

## 11. Deep Linking

The app uses scheme `fuelradar://`. Notification taps route:
- `price_alert` / `station_change` → `/alerts`
- `cheaper_nearby` / `weekly_report` → `/map`
- `favorite_price_change` with `station_id` → `/station/:id`

Universal links (iOS) / App Links (Android) require additional domain config if needed.

---

## 12. iOS Widget

See `WIDGET_SETUP.md` for the complete iOS WidgetKit implementation plan.
Widgets require EAS Build (not Expo Go) and App Groups capability.
