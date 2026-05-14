-- FuelRadar: price_history
-- Populated by the FastAPI alert worker every time it checks prices.
-- Read by the station-price-history Edge Function.
-- No FK to stations — TankerKönig IDs are UUIDs, not stored locally.

CREATE TABLE IF NOT EXISTS price_history (
    id          SERIAL PRIMARY KEY,
    station_id  VARCHAR NOT NULL,
    fuel_type   VARCHAR NOT NULL CHECK (fuel_type IN ('diesel', 'e5', 'e10')),
    price       DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_price_history_station_id        ON price_history (station_id);
CREATE INDEX IF NOT EXISTS ix_price_history_fuel_type         ON price_history (fuel_type);
CREATE INDEX IF NOT EXISTS ix_price_history_recorded_at       ON price_history (recorded_at DESC);
CREATE INDEX IF NOT EXISTS ix_price_history_station_fuel_time ON price_history (station_id, fuel_type, recorded_at DESC);
