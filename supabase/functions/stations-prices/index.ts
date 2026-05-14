// Edge Function: stations-prices
// Proxies TankerKönig prices endpoint — bulk price lookup for up to 10 stations.
// GET /functions/v1/stations-prices?ids=id1,id2,id3
// Secret required: TANKERKOENIG_API_KEY

import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

const TK_BASE = 'https://creativecommons.tankerkoenig.de/json';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('TANKERKOENIG_API_KEY');
    if (!apiKey) return errJson('TANKERKOENIG_API_KEY nicht konfiguriert', 500);

    const url = new URL(req.url);
    const idsParam = url.searchParams.get('ids');

    if (!idsParam) return errJson('ids sind erforderlich');

    const ids = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10); // TankerKönig limit

    if (ids.length === 0) return errJson('Keine gültigen IDs angegeben');

    const tkUrl = new URL(`${TK_BASE}/prices.php`);
    tkUrl.searchParams.set('ids', ids.join(','));
    tkUrl.searchParams.set('apikey', apiKey);

    const res = await fetch(tkUrl.toString());
    const data = await res.json();

    if (!data.ok) return errJson(data.message ?? 'TankerKönig-Fehler', 502);

    return okJson({ ok: true, prices: data.prices ?? {} });
  } catch (err) {
    console.error('[stations-prices]', err);
    return errJson('Interner Fehler', 500);
  }
});
