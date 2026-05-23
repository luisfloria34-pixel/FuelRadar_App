import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errJson('Method not allowed', 405);

  const cronSecret = Deno.env.get('ALERTS_CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return errJson('Unauthorized', 401);
  }

  const body = await req.json().catch(() => ({}));
  const device_uuid = body.device_uuid;
  const title = body.title ?? 'FuelRadar';
  const message = body.message ?? body.body;

  if (!device_uuid || !message) return errJson('device_uuid and message are required');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: device, error } = await supabase
    .from('devices')
    .select('expo_push_token')
    .eq('device_uuid', device_uuid)
    .maybeSingle();

  if (error) return errJson(error.message, 500);
  if (!device?.expo_push_token) return errJson('No push token registered', 404);

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify({
      to: device.expo_push_token,
      sound: 'default',
      title,
      body: message,
      data: body.data ?? { type: 'price_alert' },
      channelId: 'price-alerts',
    }),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok) return errJson('Expo push send failed', 502);
  return okJson({ ok: true, result });
});
