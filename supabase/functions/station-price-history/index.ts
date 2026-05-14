// Edge Function: station-price-history
// Reads price_history from the FuelRadar Supabase database.
// GET /functions/v1/station-price-history?station_id=UUID&fuel_type=diesel&days=7

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const station_id = url.searchParams.get('station_id');
    const fuel_type  = url.searchParams.get('fuel_type') ?? 'diesel';
    const daysParam  = url.searchParams.get('days') ?? '7';
    const days       = parseInt(daysParam, 10);

    if (!station_id) return errJson('station_id ist erforderlich');
    if (!['diesel', 'e5', 'e10'].includes(fuel_type)) {
      return errJson('fuel_type muss diesel, e5 oder e10 sein');
    }
    if (isNaN(days) || days < 1 || days > 90) {
      return errJson('days muss zwischen 1 und 90 liegen');
    }

    // Use service role key — bypasses RLS, safe server-side only
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

    if (error) {
      console.error('[station-price-history] DB error:', error);
      return errJson('Datenbankfehler', 500);
    }

    return okJson(data ?? []);
  } catch (err) {
    console.error('[station-price-history]', err);
    return errJson('Interner Fehler', 500);
  }
});
