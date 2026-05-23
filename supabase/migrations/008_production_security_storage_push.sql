-- FuelRadar production security, storage, uploads, and push support.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text,
    username text,
    avatar_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploads (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_id text NOT NULL,
    object_path text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uploads_allowed_bucket CHECK (bucket_id IN ('avatars', 'uploads', 'station-images')),
    CONSTRAINT uploads_allowed_type CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);

CREATE TABLE IF NOT EXISTS search_logs (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    query text,
    lat double precision,
    lng double precision,
    results_count integer,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE devices ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE favorite_stations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS ix_favorite_stations_user_id ON favorite_stations(user_id);
CREATE INDEX IF NOT EXISTS ix_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS ix_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS ix_uploads_user_id ON uploads(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_alert_states_alert_id ON alert_states(alert_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_own" ON devices;
DROP POLICY IF EXISTS "favorites_own" ON favorite_stations;
DROP POLICY IF EXISTS "alerts_own" ON alerts;
DROP POLICY IF EXISTS "alert_states_own" ON alert_states;

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users read own devices" ON devices FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own devices" ON devices FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users update own devices" ON devices FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users read own favorites" ON favorite_stations FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own favorites" ON favorite_stations FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own favorites" ON favorite_stations FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE POLICY "Users read own alerts" ON alerts FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own alerts" ON alerts FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users update own alerts" ON alerts FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own alerts" ON alerts FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE POLICY "Users read own alert states" ON alert_states FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM alerts a WHERE a.id = alert_states.alert_id AND a.user_id = (select auth.uid())));

CREATE POLICY "Users read own uploads" ON uploads FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own uploads" ON uploads FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own uploads" ON uploads FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('uploads', 'uploads', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('station-images', 'station-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload proof images" ON storage.objects;
DROP POLICY IF EXISTS "FuelRadar public read images" ON storage.objects;
DROP POLICY IF EXISTS "FuelRadar users read own uploads" ON storage.objects;
DROP POLICY IF EXISTS "FuelRadar users upload own images" ON storage.objects;
DROP POLICY IF EXISTS "FuelRadar users update own images" ON storage.objects;
DROP POLICY IF EXISTS "FuelRadar users delete own images" ON storage.objects;

CREATE POLICY "FuelRadar public read images" ON storage.objects
FOR SELECT TO public
USING (bucket_id IN ('avatars', 'station-images'));

CREATE POLICY "FuelRadar users read own uploads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "FuelRadar users upload own images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('avatars', 'uploads', 'station-images')
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

CREATE POLICY "FuelRadar users update own images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id IN ('avatars', 'uploads', 'station-images')
  AND (storage.foldername(name))[1] = (select auth.uid())::text
)
WITH CHECK (
  bucket_id IN ('avatars', 'uploads', 'station-images')
  AND (storage.foldername(name))[1] = (select auth.uid())::text
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

CREATE POLICY "FuelRadar users delete own images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id IN ('avatars', 'uploads', 'station-images')
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);
