# FuelRadar – New Supabase Project Setup

Follow these steps **once** to create a clean, FuelRadar-only Supabase project.

---

## Step 1 – Create a new Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and sign in.
2. Click **New project**.
3. Set:
   - **Name**: `fuelradar-production` (or any name you like)
   - **Database password**: choose a strong password and **save it** — you'll need it for `DATABASE_URL`
   - **Region**: `eu-central-1` (Frankfurt) — closest to Germany
4. Wait for provisioning (~1 min).

---

## Step 2 – Run the database migrations

Open the Supabase **SQL Editor** (left sidebar → SQL Editor → New query) and run each file **in order**:

| File | What it creates |
|---|---|
| `supabase/migrations/001_devices.sql` | `devices` table |
| `supabase/migrations/002_favorite_stations.sql` | `favorite_stations` table |
| `supabase/migrations/003_alerts.sql` | `alerts` table |
| `supabase/migrations/004_alert_states.sql` | `alert_states` table |
| `supabase/migrations/005_price_history.sql` | `price_history` table |
| `supabase/migrations/006_search_logs.sql` | `search_logs` table |
| `supabase/migrations/007_rls_policies.sql` | Row Level Security |

Paste each file's content into the SQL Editor and click **Run**.

---

## Step 3 – Add Supabase secrets (for Edge Functions)

Go to **Settings → Edge Functions → Secrets** and add:

| Secret name | Value | Required |
|---|---|---|
| `TANKERKOENIG_API_KEY` | Your TankerKönig API key from [tankerkoenig.de](https://creativecommons.tankerkoenig.de) | **Yes** |

> `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase into every edge function — you do NOT need to add them manually.

---

## Step 4 – Deploy the Edge Functions

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you haven't already:

```bash
brew install supabase/tap/supabase   # macOS
# or: npm install -g supabase
```

Link to your new project (get `YOUR_PROJECT_REF` from Settings → General):

```bash
cd /path/to/FuelRadar_App_GitHub
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy all functions at once (Supabase CLI ≥ 1.x):

```bash
supabase functions deploy
```

Or individually:

```bash
supabase functions deploy geocode
supabase functions deploy stations-nearby
supabase functions deploy station-detail
supabase functions deploy stations-prices
supabase functions deploy station-price-history
supabase functions deploy health
supabase functions deploy push-tokens
supabase functions deploy analytics-search
# New — favorites/alerts/devices (no separate backend needed)
supabase functions deploy favorites
supabase functions deploy alerts
supabase functions deploy devices
```

---

## Step 5 – Get your project credentials

In **Settings → API**:

| Value | Where to use |
|---|---|
| **Project URL** (e.g. `https://abcdef.supabase.co`) | `EXPO_PUBLIC_SUPABASE_URL` in `frontend/.env` and `SUPABASE_URL` in `backend/.env` |
| **anon / public key** | `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `frontend/.env` |
| **service_role key** | `SUPABASE_SERVICE_KEY` in `backend/.env` |

In **Settings → Database → Connection String → URI**:

| Value | Where to use |
|---|---|
| PostgreSQL URI | `DATABASE_URL` in `backend/.env` — replace `[YOUR-PASSWORD]` with the password from Step 1 |

---

## Step 6 – Update frontend `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
# EXPO_PUBLIC_API_URL is NOT needed — all calls go through Supabase Edge Functions.
```

Rebuild or restart the Expo dev server after changing `.env`:

```bash
cd frontend
npx expo start --clear
```

---

## Step 7 – No separate backend required

All favorites, alerts, and device registration are handled by Supabase Edge Functions.
No FastAPI backend deployment is needed.

---

## Step 8 – Verify

Test the edge functions are live:

```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/health" \
  -H "apikey: YOUR_ANON_KEY"
```

Expected response:
```json
{"ok":true,"service":"FuelRadar Edge Functions","timestamp":"...","functions":[...]}
```

---

## Architecture reference

```
Mobile app (Expo)
  │
  ├── edgeGet() ──────────────► Supabase Edge Functions
  │    geocode                    → Nominatim (OSM)
  │    stations-nearby            → TankerKönig API
  │    station-detail             → TankerKönig API
  │    stations-prices            → TankerKönig API
  │    station-price-history      → Supabase DB (price_history)
  │    health                     → static response
  │
  ├── edgePost() ─────────────► Supabase Edge Functions
  │    push-tokens                → Supabase DB (devices)
  │    analytics-search           → Supabase DB (search_logs)
  │
  ├── edgeFetch() ─────────────► Supabase Edge Functions (all CRUD)
  │    favorites                  → Supabase DB (favorite_stations)
  │    alerts                     → Supabase DB (alerts)
  │    devices                    → Supabase DB (devices)
  │
  └── [No separate FastAPI backend required]

FastAPI backend
  └── Direct PostgreSQL ───────► Supabase DB (via DATABASE_URL)
       Alert worker (APScheduler) → TankerKönig → Expo Push API
```

---

## Secrets checklist

| Secret | Where to add | Notes |
|---|---|---|
| `TANKERKOENIG_API_KEY` | Supabase → Settings → Edge Functions → Secrets | Required for all station data |
| `EXPO_PUBLIC_SUPABASE_URL` | `frontend/.env` | New project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `frontend/.env` | New anon key |
| `EXPO_PUBLIC_API_URL` | `frontend/.env` | Your FastAPI backend URL |
| `DATABASE_URL` | `backend/.env` | Supabase PostgreSQL URI |
| `SUPABASE_URL` | `backend/.env` | Same as `EXPO_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_KEY` | `backend/.env` | service_role key (not anon!) |
| `TANKERKOENIG_API_KEY` | `backend/.env` | Same key as above |
