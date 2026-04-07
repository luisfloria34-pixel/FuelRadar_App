# FuelRadar Backend

Produktionsreifes Backend für die FuelRadar Kraftstoffpreis-App.

## Features

- 📊 **Tankerkönig API Proxy** - Sichere API-Key Verwaltung
- 📱 **Geräteregistrierung** - Push-Token-Verwaltung
- ❤️ **Favoriten-System** - Lieblings-Tankstellen speichern
- 🔔 **Preisalarme** - Benachrichtigungen bei Preisänderungen
- ⚡ **Redis-Caching** - Schnelle Antwortzeiten
- 🗄️ **PostgreSQL** - Robuste Datenspeicherung

## Tech Stack

- FastAPI (Python 3.11)
- PostgreSQL + SQLModel
- Redis
- APScheduler
- Expo Push Notifications

## API Endpoints

### Stations
```
GET  /api/stations/nearby?lat=X&lng=X&rad=5&fuel=all&sort=dist
GET  /api/stations/{station_id}
POST /api/v2/stations/prices  (body: {ids: ["...", "..."]})
```

### Devices
```
POST /api/v2/devices  (body: {device_uuid, expo_push_token, platform, locale})
GET  /api/v2/devices/{device_uuid}
```

### Favorites
```
GET    /api/v2/favorites/{device_uuid}
POST   /api/v2/favorites/{device_uuid}  (body: {station_id, ...})
DELETE /api/v2/favorites/{device_uuid}/{station_id}
```

### Alerts
```
GET    /api/v2/alerts/{device_uuid}
POST   /api/v2/alerts/{device_uuid}  (body: {alert_type, fuel_type, ...})
PATCH  /api/v2/alerts/{device_uuid}/{alert_id}
DELETE /api/v2/alerts/{device_uuid}/{alert_id}
```

### Alert Types
- `fuel_threshold` - Preis unter Schwellenwert
- `station_change` - Preisänderung bei Tankstelle
- `nearby_cheaper` - Günstigere Tankstelle in Nähe (Premium)

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run server
uvicorn server:app --reload --port 8001
```

## Deployment (Render)

1. Push to GitHub
2. Connect to Render
3. Use `render.yaml` Blueprint
4. Set `TANKERKOENIG_API_KEY` manually

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| TANKERKOENIG_API_KEY | Yes | API Key from tankerkoenig.de |
| DATABASE_URL | Yes | PostgreSQL connection string |
| REDIS_URL | No | Redis connection string |
| ALERT_CHECK_MINUTES | No | Alert check interval (default: 5) |
| CACHE_TTL_SECONDS | No | Cache TTL (default: 60) |

## License

Daten: Tankerkönig / MTS-K (CC BY 4.0)
