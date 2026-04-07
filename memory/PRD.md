# FuelRadar - Premium Fuel Price App for Germany

## Overview
FuelRadar is a premium mobile app that helps drivers in Germany find the best fuel prices nearby. The app features a luxurious dark theme with premium UI design inspired by Tesla, Uber, and Apple Maps.

## Tech Stack
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **External API**: Tankerkönig API for real-time fuel prices in Germany

## Features

### MVP (Implemented)
1. **Splash Screen** - Animated radar logo with "Live fuel prices in Germany" tagline
2. **Onboarding** - 3 slides explaining app features (Skip/Next navigation)
3. **Home Screen**
   - Greeting based on time of day
   - Quick action cards (Cheapest, Live Map, Alerts)
   - Fuel type selector (Diesel, E5, E10)
   - Best Price Now card
   - Worth the Drive recommendation
   - Nearby stations list
4. **Map/List Screen** - Station list with filtering and sorting (distance/price)
5. **Alerts Screen** - Create price alerts with fuel type and threshold
6. **Favorites Screen** - Save preferred stations
7. **Station Detail** - Large price cards, opening hours, navigate button
8. **Settings** - Fuel preferences, search radius, about info

### Data Source
- **Without API Key**: Mock data for development/demo
- **With API Key**: Real-time data from Tankerkönig API

## Configuration

### Backend Environment Variables
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
TANKERKOENIG_API_KEY=""  # Add your key here
```

### Getting Tankerkönig API Key
1. Visit https://creativecommons.tankerkoenig.de/
2. Register with your email
3. Receive your free API key
4. Add it to `/app/backend/.env`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with API status |
| `/api/stations/nearby` | GET | Get nearby stations (params: lat, lng, rad, fuel_type, sort) |
| `/api/stations/{id}` | GET | Get station details |
| `/api/stations/prices/list` | GET | Get prices for multiple stations |
| `/api/push-tokens` | POST | Register push notification token |
| `/api/analytics/search` | POST | Log search analytics |

## Design System

### Colors
- Background: #0A0A0B
- Card: #14161A
- Border: #2A2F38
- Primary Text: #F5F7FA
- Secondary Text: #9AA3AF
- Accent Green: #32D74B
- Accent Blue: #3B82F6
- Warning Orange: #FF9F0A
- Error Red: #FF453A

### Fuel Type Colors
- Diesel: Blue (#3B82F6)
- E5: Green (#32D74B)
- E10: Orange (#FF9F0A)

## Local Storage (AsyncStorage)
- Favorites list
- Alerts configuration
- Onboarding completion status
- User preferences

## Future Enhancements
1. User authentication
2. Push notifications for price alerts
3. Native map view (already configured, works on mobile devices)
4. Price history charts
5. Route planning with fuel stops
6. Widget for home screen
