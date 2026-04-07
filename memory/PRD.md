# FuelRadar - Premium Kraftstoffpreis-App für Deutschland

## Übersicht
FuelRadar ist eine Premium-Mobil-App, die Fahrern in Deutschland hilft, die besten Kraftstoffpreise in der Nähe zu finden. Die App bietet ein luxuriöses dunkles Design inspiriert von Tesla, Uber und Apple Maps.

## Tech Stack
- **Frontend**: Expo (React Native) mit TypeScript, Expo Router
- **Backend**: FastAPI (Python)
- **State Management**: Zustand
- **Externe API**: Tankerkönig API für Echtzeit-Kraftstoffpreise, Nominatim für Geocoding
- **Push**: Expo Push Notifications

## Design System
- Background: #0A0A0B | Card: #14161A | Border: #2A2F38
- Accent Green: #32D74B | Border Radius: 22px | Padding: 16-20px
- Fuel Colors: Diesel (#3B82F6), E5 (#32D74B), E10 (#FF9F0A)

## Implementiert

### P0 - Build & Core (DONE)
- ✅ Build-Fehler behoben (SHADOWS-Varianten)
- ✅ Frontend kompiliert fehlerfrei

### P1 - Premium UI Redesign (DONE)
- ✅ Alle Screens auf Deutsch mit Premium dark Design
- ✅ Home, Karte, Alarme, Favoriten, Station Detail, Einstellungen

### P2 - Tankerkönig API (DONE)
- ✅ API-Key sicher in Backend .env
- ✅ E2E mit echten Daten (259+ Tankstellen, Live-Preise)

### PLZ-Suche (DONE - April 2026)
- ✅ Backend: `/api/geocode` Endpoint via OpenStreetMap Nominatim
- ✅ PLZ oder Ortsname → Koordinaten → Tankstellen-Suche
- ✅ Radius-Auswahl: 2 km, 5 km, 10 km (Standard), 25 km
- ✅ Dynamischer Titel "Tankstellen in {PLZ} {Stadt}"
- ✅ Location-Label unter Suchfeld
- ✅ Integriert auf Home UND Karte Screen
- ✅ Getestet mit Stuttgart (70173), München (80331), Frankfurt (60311)

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health Check |
| `/api/geocode` | GET | PLZ/Ort → Koordinaten (Nominatim) |
| `/api/stations/nearby` | GET | Tankstellen in der Nähe |
| `/api/stations/{id}` | GET | Tankstellen-Details |
| `/api/stations/prices/list` | GET | Preise für mehrere Stationen |

## Ausstehend
- ⬜ Custom Map Pins mit Preisanzeige
- ⬜ Device-Registrierung (UUID + Push Token)
- ⬜ PostgreSQL & Redis für Produktion

## Backlog
- ⬜ User Authentication
- ⬜ Premium Tier (Free vs Paid)
- ⬜ Preis-Historie Charts
- ⬜ Routenplanung mit Tankstopps
- ⬜ Preisvergleich teilen

## Architektur
```
app/
├── backend/
│   ├── app/ (core, models, routes, services, workers)
│   └── server.py (includes /api/geocode endpoint)
└── frontend/
    ├── app/ (tabs: index, map, alerts, favorites | station/[id], settings)
    └── src/ (components: PLZSearchBar, PremiumStationCard, etc.)
```
