-- Runs FuelRadar alert checks every five minutes.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.unschedule('fuelradar-alerts-check')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fuelradar-alerts-check');

SELECT cron.schedule(
  'fuelradar-alerts-check',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://jorjciajyaqzjuflxefv.supabase.co/functions/v1/alerts-check',
    headers := '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmpjaWFqeWFxemp1Zmx4ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTgxOTIsImV4cCI6MjA5MTY3NDE5Mn0.RyHbWiMUJOqJw0KP1H6J9Eg4xXQp9AtK5Mq-jRKjzeA","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmpjaWFqeWFxemp1Zmx4ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTgxOTIsImV4cCI6MjA5MTY3NDE5Mn0.RyHbWiMUJOqJw0KP1H6J9Eg4xXQp9AtK5Mq-jRKjzeA"}'::jsonb
  );
  $$
);
