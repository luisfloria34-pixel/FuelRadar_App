-- FuelRadar: alerts
-- Three alert types:
--   fuel_threshold  → threshold_price required; lat/lng optional (filters by proximity)
--   station_change  → station_id required
--   nearby_cheaper  → lat/lng + radius_km required (premium feature)

CREATE TABLE IF NOT EXISTS alerts (
    id                 SERIAL PRIMARY KEY,
    device_uuid        VARCHAR NOT NULL,
    alert_type         VARCHAR NOT NULL
                           CHECK (alert_type IN ('fuel_threshold', 'station_change', 'nearby_cheaper')),
    fuel_type          VARCHAR NOT NULL
                           CHECK (fuel_type IN ('diesel', 'e5', 'e10')),

    -- fuel_threshold fields
    threshold_price    DOUBLE PRECISION,

    -- station_change fields
    station_id         VARCHAR,
    station_name       VARCHAR,

    -- nearby_cheaper / geo fields (also used by fuel_threshold worker)
    lat                DOUBLE PRECISION,
    lng                DOUBLE PRECISION,
    radius_km          DOUBLE PRECISION NOT NULL DEFAULT 5.0,

    -- state
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered_at  TIMESTAMP WITHOUT TIME ZONE,
    trigger_count      INTEGER NOT NULL DEFAULT 0,
    is_premium_feature BOOLEAN NOT NULL DEFAULT FALSE,

    created_at         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_alerts_device_uuid ON alerts (device_uuid);
CREATE INDEX IF NOT EXISTS ix_alerts_station_id  ON alerts (station_id);
CREATE INDEX IF NOT EXISTS ix_alerts_fuel_type   ON alerts (fuel_type);
CREATE INDEX IF NOT EXISTS ix_alerts_is_active   ON alerts (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS ix_alerts_created_at  ON alerts (created_at DESC);
