// Edge Function: devices
// Upsert device registration (without requiring a push token).
// For push token specifically, use the push-tokens edge function.
//
// POST /functions/v1/devices
// Body: { device_uuid, platform?, locale?, expo_push_token? }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errJson('Method not allowed', 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { device_uuid, platform, locale, expo_push_token } = body;

    if (!device_uuid) return errJson('device_uuid is required');

    const record: Record<string, unknown> = {
      device_uuid,
      platform: platform ?? null,
      locale: locale ?? 'en',
      updated_at: new Date().toISOString(),
    };
    if (expo_push_token) record.expo_push_token = expo_push_token;

    const { data, error } = await supabase
      .from('devices')
      .upsert(record, { onConflict: 'device_uuid' })
      .select()
      .single();

    if (error) throw error;
    return okJson({ ok: true, device: data });
  } catch (err: any) {
    console.error('[devices]', err);
    return errJson(err?.message ?? 'Internal error', 500);
  }
});
