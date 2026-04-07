# FuelRadar - Premium Kraftstoffpreis-App für Deutschland

## Übersicht
FuelRadar ist eine Premium-Mobil-App, die Fahrern in Deutschland hilft, die besten Kraftstoffpreise in der Nähe zu finden. Die App bietet ein luxuriöses dunkles Design inspiriert von Tesla, Uber und Apple Maps.

## Tech Stack
- **Frontend**: Expo (React Native) mit TypeScript, Expo Router
- **Backend**: FastAPI (Python) mit PostgreSQL (SQLModel), Redis, APScheduler
- **State Management**: Zustand
- **Externe API**: Tankerkönig API für Echtzeit-Kraftstoffpreise
- **Push**: Expo Push Notifications

## Design System
- Background: #0A0A0B
- Card: #14161A
- Border: #2A2F38
- Accent Green: #32D74B
- Border Radius: 22px (RADIUS.xl)
- Padding: 16-20px (SPACING.md/lg)
- Fuel Colors: Diesel (#3B82F6), E5 (#32D74B), E10 (#FF9F0A)

## Implementiert (April 2026)

### P0 - Build & Core (DONE)
- ✅ Build-Fehler behoben (SHADOWS.medium/small fehlten im Theme)
- ✅ Frontend kompiliert und läuft fehlerfrei

### P1 - Premium UI Redesign (DONE)
- ✅ **Home Screen**: Premium-Design mit Greeting, Suchleiste, FuelSegmentedControl, RecommendationCard, PremiumStationCard
- ✅ **Karte Screen**: Komplett auf Deutsch, Filter-Panel, Sortierung (Entfernung/Preis), Ranking-Badges
- ✅ **Alarme Screen**: Preisalarme mit Modal, Kraftstoff-Auswahl, Zielpreis, deutsche Texte
- ✅ **Favoriten Screen**: Premium-Cards mit Preisanzeige, Status-Badges (Geöffnet/Geschlossen)
- ✅ **Station Detail**: Große Preisdarstellung, Öffnungszeiten, Navigation starten, Alarm setzen
- ✅ **Einstellungen**: Sprache (DE/EN), Kraftstoff-Präferenzen, Suchradius, Rechtliches
- ✅ **Komplett Deutsch**: Kein englischer Text mehr im UI
- ✅ **Premium Components**: PremiumStationCard, RecommendationCard, FuelSegmentedControl, PremiumSearchBar
- ✅ **Konsistentes Theme**: Alle Screens nutzen RADIUS.xl (22px), SPACING.lg (20px), SHADOWS.card
- ✅ **testIDs**: Auf allen interaktiven Elementen

### Backend (DONE - scaffolded)
- ✅ FastAPI Server mit CORS
- ✅ Tankerkönig API Proxy (GET /api/stations/nearby, /api/stations/{id})
- ✅ PostgreSQL Models (Device, Favorite, Alert)
- ✅ Redis Caching
- ✅ APScheduler für Alert-Prüfung
- ✅ Dockerfile & render.yaml für Deployment

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health Check |
| `/api/stations/nearby` | GET | Tankstellen in der Nähe |
| `/api/stations/{id}` | GET | Tankstellen-Details |
| `/api/stations/prices/list` | GET | Preise für mehrere Stationen |

## P2 - Ausstehend
- ⬜ Tankerkönig API-Key integrieren (User muss Key bereitstellen)
- ⬜ End-to-End Datenfluss mit echten Preisen
- ⬜ Device-Registrierung (UUID + Push Token) testen

## Backlog
- ⬜ User Authentication
- ⬜ Premium Tier (Free vs Paid Alerts)
- ⬜ Preis-Historie Charts
- ⬜ Routenplanung mit Tankstopps
- ⬜ Home Screen Widget

## Architektur
```
app/
├── backend/
│   ├── app/
│   │   ├── core/ (config, database, cache)
│   │   ├── models/ (device, favorite, alert)
│   │   ├── routes/ (stations, devices, alerts, favorites)
│   │   ├── services/ (tankerkoenig, push_notifications)
│   │   └── workers/ (alert_worker)
│   └── server.py
└── frontend/
    ├── app/
    │   ├── (tabs)/ (index, map, alerts, favorites, _layout)
    │   ├── station/[id].tsx
    │   ├── settings.tsx
    │   └── onboarding.tsx
    └── src/
        ├── components/ (PremiumStationCard, etc.)
        ├── constants/ (theme, translations)
        ├── services/ (api)
        ├── store/ (useStore)
        └── types/
```
