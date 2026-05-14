// Edge Function: geocode
// Proxies OpenStreetMap Nominatim — returns lat/lng results for a German place name or PLZ.
// GET /functions/v1/geocode?q=Berlin

import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';

    if (q.length < 2) {
      return errJson('Suchbegriff zu kurz (min. 2 Zeichen)');
    }

    const nominatim = new URL('https://nominatim.openstreetmap.org/search');
    nominatim.searchParams.set('format', 'json');
    nominatim.searchParams.set('q', q);
    nominatim.searchParams.set('countrycodes', 'de');
    nominatim.searchParams.set('limit', '5');
    nominatim.searchParams.set('addressdetails', '1');

    const res = await fetch(nominatim.toString(), {
      headers: { 'User-Agent': 'FuelRadar/1.0 (contact@fuelradar.app)' },
    });

    if (!res.ok) return errJson('Geocoding-Dienst nicht verfügbar', 502);

    const raw: Array<Record<string, string>> = await res.json();

    const results = raw.map((r) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      label: r.display_name,
      place_id: r.place_id,
    }));

    return okJson({ ok: true, results });
  } catch (err) {
    console.error('[geocode]', err);
    return errJson('Interner Fehler', 500);
  }
});
