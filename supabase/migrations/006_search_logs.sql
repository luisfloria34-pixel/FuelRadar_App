-- FuelRadar: search_logs
-- Lightweight analytics: one row per PLZ/city search from the app.
-- Written by the analytics-search Edge Function.

CREATE TABLE IF NOT EXISTS search_logs (
    id            SERIAL PRIMARY KEY,
    query         VARCHAR,
    lat           DOUBLE PRECISION,
    lng           DOUBLE PRECISION,
    results_count INTEGER,
    created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_search_logs_created_at ON search_logs (created_at DESC);
