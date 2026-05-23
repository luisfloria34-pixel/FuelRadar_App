import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const station_id = url.searchParams.get('station_id');
  const fuel_type = url.searchParams.get('fuel_type') ?? 'diesel';
  const days = Number(url.searchParams.get('days') ?? '7');

  if (!station_id) return errJson('station_id is required');
  if (!['diesel', 'e5', 'e10'].includes(fuel_type)) return errJson('Invalid fuel_type');
  if (!Number.isFinite(days) || days < 1 || days > 90) return errJson('Invalid days');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('price_history')
    .select('price, recorded_at')
    .eq('station_id', station_id)
    .eq('fuel_type', fuel_type)
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) return errJson(error.message, 500);
  return okJson(data ?? []);
});
