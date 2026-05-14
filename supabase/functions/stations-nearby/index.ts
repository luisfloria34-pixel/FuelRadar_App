// Edge Function: stations-nearby
// Proxies TankerKönig list endpoint — returns open stations within radius.
// GET /functions/v1/stations-nearby?lat=52.5&lng=13.4&rad=5&fuel_type=all&sort=dist
// Secret required: TANKERKOENIG_API_KEY

import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

const TK_BASE = 'https://creativecommons.tankerkoenig.de/json';

interface TKStation {
  id: string;
  name: string;
  brand: string;
  street: string;
  houseNumber?: string;
  postCode: string;
  place: string;
  lat: number;
  lng: number;
  diesel?: number;
  e5?: number;
  e10?: number;
  isOpen: boolean;
  dist: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('TANKERKOENIG_API_KEY');
    if (!apiKey) return errJson('TANKERKOENIG_API_KEY nicht konfiguriert', 500);

    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const rad = url.searchParams.get('rad') ?? '5';
    const fuel_type = url.searchParams.get('fuel_type') ?? 'all';
    const sort = url.searchParams.get('sort') ?? 'dist';

    if (!lat || !lng) return errJson('lat und lng sind erforderlich');

    const tkUrl = new URL(`${TK_BASE}/list.php`);
    tkUrl.searchParams.set('lat', lat);
    tkUrl.searchParams.set('lng', lng);
    tkUrl.searchParams.set('rad', rad);
    tkUrl.searchParams.set('sort', sort);
    tkUrl.searchParams.set('type', fuel_type);
    tkUrl.searchParams.set('apikey', apiKey);

    const res = await fetch(tkUrl.toString());
    const data = await res.json();

    if (!data.ok) return errJson(data.message ?? 'TankerKönig-Fehler', 502);

    const stations = (data.stations as TKStation[] ?? []).map((s) => ({
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
      dist: s.dist,
    }));

    return okJson({ ok: true, stations });
  } catch (err) {
    console.error('[stations-nearby]', err);
    return errJson('Interner Fehler', 500);
  }
});
