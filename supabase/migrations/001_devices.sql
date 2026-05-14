-- FuelRadar: devices
-- Stores one row per physical device (app install).
-- Push token is updated on every app launch.

CREATE TABLE IF NOT EXISTS devices (
    id              SERIAL PRIMARY KEY,
    device_uuid     VARCHAR NOT NULL,
    expo_push_token VARCHAR,
    platform        VARCHAR CHECK (platform IN ('ios', 'android')),
    locale          VARCHAR NOT NULL DEFAULT 'de' CHECK (locale IN ('de', 'en')),
    is_premium      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_devices_uuid UNIQUE (device_uuid)
);

CREATE INDEX IF NOT EXISTS ix_devices_device_uuid ON devices (device_uuid);
CREATE INDEX IF NOT EXISTS ix_devices_created_at  ON devices (created_at DESC);
