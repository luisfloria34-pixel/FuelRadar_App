-- Migration: Add price_history table
-- Run once against your PostgreSQL database if the table was not auto-created on startup

CREATE TABLE IF NOT EXISTS price_history (
    id          SERIAL PRIMARY KEY,
    station_id  VARCHAR NOT NULL,
    fuel_type   VARCHAR NOT NULL,  -- diesel | e5 | e10
    price       DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_price_history_station_id ON price_history (station_id);
CREATE INDEX IF NOT EXISTS ix_price_history_fuel_type  ON price_history (fuel_type);
CREATE INDEX IF NOT EXISTS ix_price_history_station_fuel_time
    ON price_history (station_id, fuel_type, recorded_at DESC);
