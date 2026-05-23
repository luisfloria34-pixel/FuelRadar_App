// Edge Function: health
// Simple liveness check — used by the frontend api.ts healthCheck() call.
// GET /functions/v1/health

import { corsHeaders, okJson } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  return okJson({
    ok: true,
    service: 'FuelRadar Edge Functions',
    timestamp: new Date().toISOString(),
    functions: [
      'geocode',
      'stations-nearby',
      'station-detail',
      'stations-prices',
      'station-prices',
      'station-price-history',
      'station-history',
      'health',
      'push-tokens',
      'push-register',
      'push-send',
      'analytics-search',
      'favorites',
      'alerts',
      'alerts-create',
      'alerts-check',
      'devices',
    ],
  });
});
