// Edge Function: analytics-search
// Logs PLZ/city search events to the search_logs table.
// Called via supabase.functions.invoke('analytics-search', { body: { query, lat, lng, results_count } })
// POST /functions/v1/analytics-search

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errJson('Methode nicht erlaubt', 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { query, lat, lng, results_count } = body as Record<string, unknown>;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fire-and-forget — errors must not break the app
    await supabase.from('search_logs').insert({
      query:         typeof query === 'string' ? query : null,
      lat:           typeof lat === 'number' ? lat : null,
      lng:           typeof lng === 'number' ? lng : null,
      results_count: typeof results_count === 'number' ? results_count : null,
    });

    return okJson({ ok: true });
  } catch (err) {
    console.error('[analytics-search]', err);
    // Never fail the caller on analytics errors
    return okJson({ ok: true });
  }
});
