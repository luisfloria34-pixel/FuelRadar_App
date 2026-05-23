import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errJson('Method not allowed', 405);

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const device_uuid = url.searchParams.get('device_uuid') ?? body.device_uuid;
  if (!device_uuid) return errJson('device_uuid is required');
  if (!body.fuel_type) return errJson('fuel_type is required');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      device_uuid,
      alert_type: body.alert_type ?? 'fuel_threshold',
      fuel_type: body.fuel_type,
      threshold_price: body.threshold_price ?? null,
      station_id: body.station_id ?? null,
      station_name: body.station_name ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      radius_km: body.radius_km ?? 10,
      is_active: true,
    })
    .select()
    .single();

  if (error) return errJson(error.message, 500);
  return okJson(data);
});
