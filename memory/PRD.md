# FuelRadar - Premium Kraftstoffpreis-App für Deutschland

## Übersicht
FuelRadar ist eine Premium-Mobil-App für Fahrer in Deutschland. Luxuriöses dunkles Design inspiriert von Tesla, Uber und Apple Maps.

## Tech Stack
- **Frontend**: Expo (React Native), TypeScript, Expo Router, Zustand
- **Backend**: FastAPI (Python), MongoDB
- **Karte Web**: Leaflet CDN + CARTO Dark-Matter Tiles
- **Karte Native**: react-native-maps + UrlTile (CARTO Dark)
- **APIs**: Tankerkönig (Kraftstoffpreise), Nominatim (Geocoding)

## Design System
- Background: #0A0A0B | Card: #14161A | Border: #2A2F38
- Accent Green: #22C55E | Border-Radius: 22px | Padding: 20px
- Fuel: Diesel (#3B82F6), E5 (#32D74B), E10 (#FF9F0A)
- Price: 38px bold, superscript letzte Ziffer

## Implementiert (April 2026)

### Core Features (DONE)
- ✅ 5 Haupt-Screens: Home, Karte, Alarme, Favoriten, Einstellungen
- ✅ Station Detail mit großen Preiskarten
- ✅ Komplett auf Deutsch

### Tankerkönig API (DONE)
- ✅ Live-Preise von echten Tankstellen
- ✅ API-Key sicher im Backend

### PLZ-Suche (DONE)
- ✅ Nominatim Geocoding für PLZ/Ort → Koordinaten
- ✅ Radius-Auswahl: 2, 5, 10, 25 km

### Premium UI (DONE)
- ✅ Große Preise mit Superscript
- ✅ LIVE-EMPFEHLUNG mit pulsierendem Dot
- ✅ Dark Theme durchgängig

### Karte / Map Screen (DONE - April 2026)
- ✅ **react-native-maps** mit UrlTile für CARTO Dark Tiles (native)
- ✅ **Leaflet CDN** mit CARTO Dark Tiles (web preview)
- ✅ **Platform-specific files**: MapRenderer.tsx (native) + MapRenderer.web.tsx (web)
- ✅ **GPS-Standort** automatisch beim Laden
- ✅ **Fallback**: Letzte PLZ-Koordinaten wenn GPS verweigert
- ✅ **Custom Preis-Marker**: Grüne Pill (#22C55E) für günstigste, dunkelgraue (#1C1C1E) für andere
- ✅ **Ausgewählter Marker**: Weiß mit grünem Rand + Glow-Effekt
- ✅ **Bottom Sheet**: Marke, Name, Adresse, Geöffnet/Geschlossen, Entfernung, 3 Preiskarten
- ✅ **Navigation-Button**: Apple Maps (iOS) / Google Maps (Android/Web)
- ✅ **Details-Button**: Station-Detail-Seite
- ✅ **Favorit-Button**: Herz-Icon
- ✅ **PLZ-Suche auf Karte**: Nominatim Geocoding → Map recenter + Marker reload
- ✅ **Kraftstoff-Filter**: Diesel/E5/E10 → Marker-Preise aktualisieren
- ✅ **Radius-Filter**: 2/5/10/25 km → Tankstellen filtern
- ✅ **Station-Count-Badge**: z.B. "152 Tankstellen"

## Code Architecture
```
frontend/src/components/
├── MapRenderer.tsx      (native: react-native-maps + UrlTile)
├── MapRenderer.web.tsx  (web: Leaflet CDN + CARTO tiles)
├── PremiumStationCard.tsx
├── RecommendationCard.tsx
├── FuelSegmentedControl.tsx
├── PLZSearchBar.tsx
└── StationCard.tsx
```

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/geocode` | GET | PLZ/Ort → Koordinaten |
| `/api/stations/nearby` | GET | Tankstellen in der Nähe |
| `/api/stations/{id}` | GET | Tankstellen-Details |

## Ausstehend
- ⬜ Device-Registrierung (Push Notifications)
- ⬜ PostgreSQL & Redis für Produktion

## Backlog
- ⬜ User Authentication
- ⬜ Premium Tier (Free vs Paid)
- ⬜ Preis-Historie Charts
- ⬜ Routenplanung mit Tankstopps
- ⬜ Preisvergleich teilen
- ⬜ Auto-Vervollständigung bei PLZ-Suche
