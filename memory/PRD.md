# FuelRadar - Premium Kraftstoffpreis-App für Deutschland

## Übersicht
FuelRadar ist eine Premium-Mobil-App für Fahrer in Deutschland. Luxuriöses dunkles Design inspiriert von Tesla, Uber und Apple Maps.

## Tech Stack
- **Frontend**: Expo (React Native), TypeScript, Expo Router, Zustand
- **Backend**: FastAPI (Python), MongoDB
- **APIs**: Tankerkönig (Kraftstoffpreise), Nominatim (Geocoding), Mapbox GL JS (Karte)

## Design System
- Background: #0A0A0B | Card: #14161A | Border: #2A2F38
- Accent: #32D74B | Border-Radius: 22px | Padding: 20px
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
- ✅ Dynamischer Titel und Location-Label

### Premium UI Polish (DONE)
- ✅ **Große Preise** (38px) mit Superscript-Ziffer (z.B. "2,20⁹ €")
- ✅ **LIVE-EMPFEHLUNG** mit pulsierendem Dot, Einsparung, Prozent
- ✅ **Animationen**: Scale on press, Favorite bounce
- ✅ **Hierarchie**: Preis → Entfernung → Aktualisierungszeit → LIVE Badge
- ✅ **Section Separators** für klare Gliederung
- ✅ **Farbige Fuel-Dots** und Fuel-Badges
- ✅ **Rank-Badges** bei Preissortierung (Günstigster, 2./3. Platz)

### Karte / Map Screen (DONE - April 2026)
- ✅ **Mapbox GL JS** via CDN (dark-v11 Theme) für Web
- ✅ **@rnmapbox/maps** Plugin für native Builds
- ✅ **Custom Preis-Marker**: Grüne Pill (#22C55E) für günstigste, dunkelgraue (#2A2F38) für andere
- ✅ **Ausgewählter Marker**: Weiß mit grünem Rand + Glow-Effekt
- ✅ **Bottom Sheet**: Marke, Name, Adresse, Geöffnet/Geschlossen, Entfernung, 3 Preiskarten (Diesel/E5/E10)
- ✅ **Navigation-Button**: Öffnet Apple Maps (iOS) / Google Maps (Android/Web)
- ✅ **Details-Button**: Navigiert zur Station-Detail-Seite
- ✅ **Favorit-Button**: Herz-Icon zum Favorisieren
- ✅ **PLZ-Suche auf Karte**: Nominatim Geocoding → Map recenter + Marker reload
- ✅ **Kraftstoff-Filter**: Diesel/E5/E10 → Marker-Preise aktualisieren
- ✅ **Radius-Filter**: 2/5/10/25 km → Tankstellen filtern
- ✅ **Station-Count-Badge**: z.B. "152 Tankstellen"

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/geocode` | GET | PLZ/Ort → Koordinaten |
| `/api/stations/nearby` | GET | Tankstellen in der Nähe |
| `/api/stations/{id}` | GET | Tankstellen-Details |
| `/api/stations/prices/list` | GET | Preise für mehrere Stationen |

## Ausstehend
- ⬜ Device-Registrierung (Push Notifications)
- ⬜ PostgreSQL & Redis für Produktion (aktuell MongoDB)

## Backlog
- ⬜ User Authentication
- ⬜ Premium Tier (Free vs Paid)
- ⬜ Preis-Historie Charts
- ⬜ Routenplanung mit Tankstopps
- ⬜ Preisvergleich teilen
- ⬜ Auto-Vervollständigung bei PLZ-Suche
- ⬜ Offline-Modus mit gecachten Preisen
