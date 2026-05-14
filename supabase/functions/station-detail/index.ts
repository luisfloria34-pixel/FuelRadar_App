// Edge Function: station-detail
// Proxies TankerKönig detail endpoint — returns full station info incl. opening times.
// GET /functions/v1/station-detail?id=STATION_UUID
// Secret required: TANKERKOENIG_API_KEY

import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

const TK_BASE = 'https://creativecommons.tankerkoenig.de/json';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('TANKERKOENIG_API_KEY');
    if (!apiKey) return errJson('TANKERKOENIG_API_KEY nicht konfiguriert', 500);

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) return errJson('id ist erforderlich');

    const tkUrl = new URL(`${TK_BASE}/detail.php`);
    tkUrl.searchParams.set('id', id);
    tkUrl.searchParams.set('apikey', apiKey);

    const res = await fetch(tkUrl.toString());
    const data = await res.json();

    if (!data.ok) return errJson(data.message ?? 'Tankstelle nicht gefunden', 404);

    const s = data.station;
    const station = {
      id: s.id,
      name: s.name,
      brand: s.brand,
      street: s.street,
      house_number: s.houseNumber ?? '',
      post_code: s.postCode,
      place: s.place,
      lat: s.lat,
      lng: s.lng,
      diesel: s.diesel ?? null,
      e5: s.e5 ?? null,
      e10: s.e10 ?? null,
      is_open: s.isOpen,
      dist: s.dist ?? 0,
      whole_day: s.wholeDay ?? false,
      opening_times: s.openingTimes ?? [],
      overrides: s.overrides ?? [],
      state: s.state ?? null,
    };

    return okJson({ ok: true, station });
  } catch (err) {
    console.error('[station-detail]', err);
    return errJson('Interner Fehler', 500);
  }
});
