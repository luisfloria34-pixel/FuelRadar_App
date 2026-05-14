// Edge Function: push-tokens
// Upserts an Expo push token for a device into the devices table.
// Called by the mobile app via supabase.functions.invoke('push-tokens', { body: { token, device_id } })
// POST /functions/v1/push-tokens

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errJson('Methode nicht erlaubt', 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { token, device_id, platform, locale } = body as Record<string, string>;

    if (!token || !device_id) {
      return errJson('token und device_id sind erforderlich');
    }

    if (!token.startsWith('ExponentPushToken')) {
      return errJson('Ungültiges Expo-Push-Token-Format');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase.from('devices').upsert(
      {
        device_uuid:     device_id,
        expo_push_token: token,
        platform:        platform ?? null,
        locale:          locale ?? 'de',
        updated_at:      new Date().toISOString(),
      },
      { onConflict: 'device_uuid' },
    );

    if (error) {
      console.error('[push-tokens] upsert error:', error);
      return errJson('Datenbankfehler', 500);
    }

    return okJson({ ok: true });
  } catch (err) {
    console.error('[push-tokens]', err);
    return errJson('Interner Fehler', 500);
  }
});
