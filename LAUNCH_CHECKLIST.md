# FuelRadar — Launch Checklist

Generated: 2026-05-17  
Status: **PRE-LAUNCH — items below must be resolved before App Store / Google Play submission**

---

## 1. EAS Build Secrets (REQUIRED)

These environment variables must be set as EAS secrets **before building** for production.
Without them the app cannot fetch station data or send push notifications.

| Variable | Purpose | Where to set |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | FastAPI backend URL (push token registration, alerts, analytics) | `eas secret:create --name EXPO_PUBLIC_API_URL --value https://your-backend.com` |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL for Edge Functions | `eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value https://xxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ...` |

**How to set them:**
```bash
cd frontend
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://your-backend.com"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxx.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
```

---

## 2. Push Notifications (REQUIRED for alerts to work)

- [ ] Push notifications **only work in a production or EAS development build** — not in Expo Go.
- [ ] Run `eas build --platform ios --profile production` and `eas build --platform android --profile production` before testing push.
- [ ] The iOS push certificate (APS) is already set in `app.json` via `"aps-environment": "production"`.
- [ ] Test with `expo-notifications` Expo push notification tool after first production build.

**Current Expo Go behavior:** Push token registration is silently skipped — no crash, no error spam.

---

## 3. App Store Screenshots (REQUIRED)

Apple App Store requires screenshots for every device class the app claims to support.

| Device | Size | Required |
|---|---|---|
| iPhone 6.7" (Pro Max) | 1290 × 2796 px | ✅ Yes |
| iPhone 6.1" | 1179 × 2556 px | Optional |
| iPad Pro 12.9" | 2048 × 2732 px | Only if `supportsTablet: true` in app.json |

**Current `app.json`:** `"supportsTablet": true` → iPad screenshots required.

Recommendation: either set `"supportsTablet": false` to skip iPad screenshots, or provide them.

---

## 4. Privacy Policy (REQUIRED)

Apple and Google **require a live privacy policy URL** before allowing app submission.

- [ ] Host the privacy policy at a real HTTPS URL (e.g., `https://fuelradar.app/datenschutz`)
- [ ] Add the URL to App Store Connect → App → App Privacy
- [ ] Add the URL to Google Play Console → App content → Privacy policy
- [ ] The in-app privacy policy screen (`app/datenschutz.tsx`) is in German — consider adding an English version

---

## 5. Firebase / Google Services (Android) (REQUIRED)

- [ ] The current `google-services.json` in `frontend/google-services.json` may be a development/placeholder key.
- [ ] Replace with the **production** `google-services.json` from [Firebase Console](https://console.firebase.google.com) matching the package name `com.luishustler.fuelradar`.
- [ ] Verify the package name in `app.json` matches: `"package": "com.luishustler.fuelradar"`

---

## 6. Bundle Identifiers / Package Names

| Platform | Value | File |
|---|---|---|
| iOS Bundle ID | `com.luishustler.fuelradar` | `app.json` → `ios.bundleIdentifier` |
| Android Package | `com.luishustler.fuelradar` | `app.json` → `android.package` |
| EAS Owner | `swyone-project` | `app.json` → `owner` |
| EAS Project ID | `b0739ace-fc56-4264-98d1-cd22d43d1535` | `app.json` → `extra.eas.projectId` |

Verify all of these match what is registered in:
- [Expo Dashboard](https://expo.dev)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)

---

## 7. OTA Updates (Optional but recommended)

- [ ] Add `expo-updates` to enable over-the-air updates post-launch
- [ ] Set `runtimeVersion` in `app.json` for managed OTA
- [ ] Configure `updates.url` pointing to EAS Update

```bash
npx expo install expo-updates
eas update:configure
```

---

## 8. Legal Pages

- [ ] `app/datenschutz.tsx` (Privacy Policy) — currently German only. Needs English version or bilingual display when language = English.
- [ ] `app/nutzungsbedingungen.tsx` (Terms of Service) — bilingual content is already included. Verify English shows when language = English.
- [ ] Tankerkönig data attribution is mandatory per CC BY 4.0 license — already shown in Settings and legal footer.

---

## 9. App Store Metadata

Prepare the following for App Store Connect and Google Play:

| Field | English | German |
|---|---|---|
| App Name | FuelRadar | FuelRadar |
| Subtitle | Live fuel prices in Germany | Live Spritpreise in Deutschland |
| Description | Find the cheapest fuel prices near you... | Finde die günstigsten Kraftstoffpreise... |
| Keywords | fuel prices, gas station, diesel, petrol, cheap fuel | Tankstellen, Spritpreise, Diesel, günstig tanken |
| Category | Navigation | Navigation |
| Age Rating | 4+ | 4+ |
| Support URL | https://fuelradar.app/support | — |
| Privacy URL | https://fuelradar.app/datenschutz | — |

---

## 10. Functionality Checklist

Run through these before submission:

- [ ] Fresh install → English onboarding appears (3 pages)
- [ ] Onboarding completion → saves preferences → navigates to Home
- [ ] Settings → Reset Onboarding → confirmation → navigates to onboarding immediately
- [ ] Language switch DE → EN → all text updates instantly (no German visible)
- [ ] Language switch EN → DE → all text updates instantly (no English visible)
- [ ] Home: greeting, title, search, fuel selector, station cards — all translated
- [ ] Map: search placeholder, fuel pills, status badges, sheet buttons — all translated
- [ ] Alerts: title, empty state, create modal, labels — all translated
- [ ] Favorites: empty state, remove dialog, station cards — all translated
- [ ] Settings: all labels — all translated
- [ ] Location permission → Berlin fallback when denied (NOT San Francisco)
- [ ] Favorites save after app restart
- [ ] Alerts save after app restart
- [ ] Search radius saves after app restart
- [ ] No red/crash screens on any screen
- [ ] No console.error spam (all converted to console.warn)
- [ ] Push notifications: gracefully skip in Expo Go (no crash)

---

## 11. Known Limitations (Not Launch Blockers)

| Item | Status | Notes |
|---|---|---|
| Super Plus / LPG / CNG / HVO / AdBlue prices | Not available | Tankerkönig API only provides Diesel/E5/E10. Extended types saved as preference but price display falls back. |
| Electric vehicle charging prices | Not implemented | Shown as "Coming soon" in onboarding |
| Backend alert push delivery | Requires backend + EXPO_PUBLIC_API_URL | App-side is ready |
| Analytics (PostHog/Firebase) | Not integrated | `fuelApi.logSearch` exists but is not called |
| `@rnmapbox/maps` package | Installed but unused | Can remove to reduce bundle size: `npm uninstall @rnmapbox/maps` |
| `axios` package | Installed but unused | Can remove: `npm uninstall axios` |
| Privacy policy in English | Missing | Currently German-only |

---

## 12. Quick Commands Reference

```bash
# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android

# Set secrets
eas secret:create --scope project --name KEY --value value

# OTA update push
eas update --branch production --message "Bug fix"
```
