import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errJson('Method not allowed', 405);

  const body = await req.json().catch(() => ({}));
  const token = body.token ?? body.expo_push_token;
  const device_uuid = body.device_uuid ?? body.device_id;

  if (!token || !device_uuid) return errJson('token and device_uuid are required');
  if (!String(token).startsWith('ExponentPushToken')) return errJson('Invalid Expo push token');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase
    .from('devices')
    .upsert({
      device_uuid,
      expo_push_token: token,
      platform: body.platform ?? null,
      locale: body.locale ?? 'de',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'device_uuid' })
    .select()
    .single();

  if (error) return errJson(error.message, 500);
  return okJson({ ok: true, device: data });
});
