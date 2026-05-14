-- FuelRadar: Row Level Security
--
-- Security model:
--   • All writes come from the FastAPI backend (uses DATABASE_URL with service role).
--   • All Edge Function DB access uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
--   • The anon key exposed to the mobile app has NO direct table access.
--   • This means enabling RLS with no anon policies is the correct setup:
--     only the service role can read/write any table.
--
-- If you later add Supabase Auth, add per-user policies here.

ALTER TABLE devices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_states      ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs       ENABLE ROW LEVEL SECURITY;

-- No policies are added intentionally.
-- Supabase service role bypasses RLS automatically, so the FastAPI
-- backend and Edge Functions retain full access.
-- The mobile app's anon key cannot query any table directly.
