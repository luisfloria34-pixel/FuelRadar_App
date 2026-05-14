-- FuelRadar: alert_states
-- Tracks the last known price / station seen by the alert worker so that
-- repeat notifications are suppressed when the price has not improved.
-- Cascades on alert delete to avoid orphaned rows.

CREATE TABLE IF NOT EXISTS alert_states (
    id              SERIAL PRIMARY KEY,
    alert_id        INTEGER NOT NULL REFERENCES alerts (id) ON DELETE CASCADE,
    last_price      DOUBLE PRECISION,
    last_station_id VARCHAR,
    last_check_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_alert_states_alert_id ON alert_states (alert_id);
