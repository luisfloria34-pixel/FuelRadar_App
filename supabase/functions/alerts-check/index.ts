import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

const TK_BASE = 'https://creativecommons.tankerkoenig.de/json';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type AlertRow = {
  id: number;
  device_uuid: string;
  fuel_type: 'diesel' | 'e5' | 'e10';
  threshold_price: number | null;
  station_id: string | null;
  lat: number | null;
  lng: number | null;
  radius_km: number;
};

async function sendPush(token: string, title: string, body: string, data: Record<string, unknown>) {
  if (!token.startsWith('ExponentPushToken')) return;
  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      channelId: 'price-alerts',
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (!['GET', 'POST'].includes(req.method)) return errJson('Method not allowed', 405);

  const cronSecret = Deno.env.get('ALERTS_CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return errJson('Unauthorized', 401);
  }

  const apiKey = Deno.env.get('TANKERKOENIG_API_KEY');
  if (!apiKey) return errJson('TANKERKOENIG_API_KEY not configured', 500);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('id, device_uuid, fuel_type, threshold_price, station_id, lat, lng, radius_km')
    .eq('is_active', true)
    .not('threshold_price', 'is', null)
    .limit(100);

  if (error) return errJson(error.message, 500);

  let checked = 0;
  let triggered = 0;

  for (const alert of (alerts ?? []) as AlertRow[]) {
    checked += 1;
    let station: Record<string, any> | null = null;

    if (alert.station_id) {
      const detailUrl = new URL(`${TK_BASE}/detail.php`);
      detailUrl.searchParams.set('id', alert.station_id);
      detailUrl.searchParams.set('apikey', apiKey);
      const res = await fetch(detailUrl);
      const json = await res.json().catch(() => null);
      station = json?.ok ? json.station : null;
    } else if (alert.lat != null && alert.lng != null) {
      const listUrl = new URL(`${TK_BASE}/list.php`);
      listUrl.searchParams.set('lat', String(alert.lat));
      listUrl.searchParams.set('lng', String(alert.lng));
      listUrl.searchParams.set('rad', String(Math.min(Math.max(alert.radius_km ?? 5, 1), 25)));
      listUrl.searchParams.set('sort', 'price');
      listUrl.searchParams.set('type', alert.fuel_type);
      listUrl.searchParams.set('apikey', apiKey);
      const res = await fetch(listUrl);
      const json = await res.json().catch(() => null);
      station = json?.ok ? (json.stations ?? []).find((s: any) => s?.isOpen && s?.[alert.fuel_type]) : null;
    }

    const price = station?.[alert.fuel_type];
    if (typeof price !== 'number') continue;

    await supabase.from('price_history').insert({
      station_id: station.id ?? alert.station_id,
      fuel_type: alert.fuel_type,
      price,
      recorded_at: new Date().toISOString(),
    });

    const { data: state } = await supabase
      .from('alert_states')
      .select('last_price')
      .eq('alert_id', alert.id)
      .maybeSingle();

    await supabase.from('alert_states').upsert({
      alert_id: alert.id,
      last_price: price,
      last_station_id: station.id ?? alert.station_id,
      last_check_at: new Date().toISOString(),
    }, { onConflict: 'alert_id' });

    if (price > Number(alert.threshold_price)) continue;
    if (state?.last_price != null && Number(state.last_price) <= price) continue;

    const { data: device } = await supabase
      .from('devices')
      .select('expo_push_token')
      .eq('device_uuid', alert.device_uuid)
      .maybeSingle();

    if (device?.expo_push_token) {
      const label = alert.fuel_type === 'e5' ? 'Super E5' : alert.fuel_type === 'e10' ? 'Super E10' : 'Diesel';
      await sendPush(
        device.expo_push_token,
        'FuelRadar Preisalarm',
        `${label} dropped below ${Number(alert.threshold_price).toFixed(2)}€ nearby`,
        { type: 'price_alert', alert_id: alert.id, station_id: station.id },
      );
      triggered += 1;
    }

    const { data: current } = await supabase
      .from('alerts')
      .select('trigger_count')
      .eq('id', alert.id)
      .maybeSingle();

    await supabase
      .from('alerts')
      .update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: Number(current?.trigger_count ?? 0) + 1,
      })
      .eq('id', alert.id);
  }

  return okJson({ ok: true, checked, triggered });
});
