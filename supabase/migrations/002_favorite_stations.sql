-- FuelRadar: favorite_stations
-- One row per (device, station) pair. device_uuid is the FK to devices.device_uuid.
-- street and place are denormalised from TankerKönig at save time.

CREATE TABLE IF NOT EXISTS favorite_stations (
    id            SERIAL PRIMARY KEY,
    device_uuid   VARCHAR NOT NULL,
    station_id    VARCHAR NOT NULL,
    station_name  VARCHAR NOT NULL,
    station_brand VARCHAR NOT NULL,
    street        VARCHAR,
    place         VARCHAR,
    lat           DOUBLE PRECISION NOT NULL,
    lng           DOUBLE PRECISION NOT NULL,
    created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_favorite_device_station UNIQUE (device_uuid, station_id)
);

CREATE INDEX IF NOT EXISTS ix_favorite_stations_device_uuid ON favorite_stations (device_uuid);
CREATE INDEX IF NOT EXISTS ix_favorite_stations_station_id  ON favorite_stations (station_id);
CREATE INDEX IF NOT EXISTS ix_favorite_stations_created_at  ON favorite_stations (created_at DESC);
