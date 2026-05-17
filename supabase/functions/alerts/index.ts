// Edge Function: alerts
// CRUD for alerts table — requires service role to bypass RLS.
//
// GET    /functions/v1/alerts?device_uuid=xxx                      → list alerts
// POST   /functions/v1/alerts?device_uuid=xxx  + body              → create alert
// PATCH  /functions/v1/alerts?device_uuid=xxx&alert_id=N + body    → update alert
// DELETE /functions/v1/alerts?device_uuid=xxx&alert_id=N           → delete alert

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const device_uuid = url.searchParams.get('device_uuid');
  if (!device_uuid) return errJson('device_uuid is required');

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('device_uuid', device_uuid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return okJson(data ?? []);
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const {
        alert_type = 'fuel_threshold',
        fuel_type,
        threshold_price,
        station_id,
        station_name,
        lat,
        lng,
        radius_km = 10,
      } = body;

      if (!fuel_type) return errJson('fuel_type is required');

      const { data, error } = await supabase
        .from('alerts')
        .insert({
          device_uuid,
          alert_type,
          fuel_type,
          threshold_price: threshold_price ?? null,
          station_id: station_id ?? null,
          station_name: station_name ?? null,
          lat: lat ?? null,
          lng: lng ?? null,
          radius_km,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return okJson(data);
    }

    if (req.method === 'PATCH') {
      const alert_id = url.searchParams.get('alert_id');
      if (!alert_id) return errJson('alert_id is required');
      const body = await req.json().catch(() => ({}));
      const { data, error } = await supabase
        .from('alerts')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', Number(alert_id))
        .eq('device_uuid', device_uuid)
        .select()
        .single();
      if (error) throw error;
      return okJson(data);
    }

    if (req.method === 'DELETE') {
      const alert_id = url.searchParams.get('alert_id');
      if (!alert_id) return errJson('alert_id is required');
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', Number(alert_id))
        .eq('device_uuid', device_uuid);
      if (error) throw error;
      return okJson({ ok: true });
    }

    return errJson('Method not allowed', 405);
  } catch (err: any) {
    console.error('[alerts]', err);
    return errJson(err?.message ?? 'Internal error', 500);
  }
});
