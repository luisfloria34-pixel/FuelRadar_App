# FuelRadar iOS Widget — Setup Plan

## Overview

FuelRadar will support an iOS home-screen widget that shows live fuel prices.
This document describes how to implement it step-by-step once you are ready
to eject from Expo managed workflow or run an EAS Build with a native module.

---

## Constraints

| Constraint | Detail |
|---|---|
| **WidgetKit required** | iOS widgets use Apple's WidgetKit framework (Swift/SwiftUI). React Native cannot render widget UI directly. |
| **Expo Go cannot test widgets** | Expo Go is a sandboxed app. Widget extensions run as separate processes and cannot be tested inside Expo Go. Use a Development Build or production archive. |
| **EAS Build required** | You need `eas build --platform ios` (or Xcode archive) to include the widget extension target. |
| **App Groups required** | The app and widget share data via an App Groups container. This requires an Apple capability: `com.apple.security.application-groups`. |
| **Expo managed workflow** | In managed workflow, you add native code via `app.json` plugins or by ejecting with `expo prebuild`. |

---

## Planned Widget Sizes

### Small (2×2)
- FuelRadar logo (top-left)
- Preferred fuel type label
- Cheapest nearby price (large)
- Station name (small)
- Distance badge

### Medium (4×2)
- Three fuel prices side-by-side: Diesel / E5 / E10
- Station name under each
- Last-updated time
- "Tap to open" footer

### Large (4×4)
- Favorite stations list with current prices
- Active price alerts
- Last-updated time

---

## Shared Data Structure

The app writes this JSON to the App Groups container.
The widget reads it natively. See `frontend/src/services/widgetData.ts` for
the TypeScript placeholder.

```json
{
  "preferredFuelType": "diesel",
  "cheapestStationName": "Aral Hauptstr.",
  "cheapestPrice": 1.759,
  "distance": 0.8,
  "lastUpdated": "2026-05-17T14:30:00Z"
}
```

---

## Implementation Steps

### 1. Configure App Groups
1. In Apple Developer portal → Identifiers → FuelRadar App ID → Capabilities → App Groups.
2. Create group: `group.com.yourcompany.fuelradar`
3. Enable the same group on the widget extension App ID.

### 2. Add app.json plugin entry
```json
{
  "expo": {
    "plugins": [
      ["expo-build-properties", { "ios": { "entitlementsFilePath": "./ios/FuelRadar.entitlements" } }]
    ]
  }
}
```

### 3. Run `expo prebuild`
```bash
npx expo prebuild --platform ios
```
This generates the `/ios` folder where you add the widget target.

### 4. Add WidgetKit target in Xcode
1. Open `ios/FuelRadar.xcworkspace` in Xcode.
2. File → New → Target → Widget Extension.
3. Name it `FuelRadarWidget`.
4. Add it to the same App Group.

### 5. Write Swift widget code
The widget reads from `UserDefaults(suiteName: "group.com.yourcompany.fuelradar")`.

```swift
struct FuelRadarWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "FuelRadarWidget", provider: Provider()) { entry in
            FuelRadarWidgetView(entry: entry)
        }
        .configurationDisplayName("FuelRadar")
        .description("Live Kraftstoffpreise in deiner Nähe")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### 6. Write shared data from React Native
Replace the AsyncStorage placeholder in `widgetData.ts` with a native module
(e.g. `@react-native-community/async-storage` mapped to App Groups, or a custom
Expo module that calls `UserDefaults(suiteName:)`).

### 7. Build and test
```bash
eas build --platform ios --profile development
```

---

## Notes
- Widget refresh rate is controlled by iOS (WidgetKit timeline). You cannot push-refresh from the app in real-time.
- Use a TimelineProvider that reloads every 15–30 minutes via `getTimeline(in:completion:)`.
- Mark stale data visually in the widget if `lastUpdated` is older than 30 minutes.
- Widget data is read-only — tapping opens the app, which updates prices.
