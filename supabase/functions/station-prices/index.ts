import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

const TK_BASE = 'https://creativecommons.tankerkoenig.de/json';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const apiKey = Deno.env.get('TANKERKOENIG_API_KEY');
  if (!apiKey) return errJson('TANKERKOENIG_API_KEY not configured', 500);

  const url = new URL(req.url);
  const idsParam = url.searchParams.get('ids');
  if (!idsParam) return errJson('ids are required');

  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10);
  if (ids.length === 0) return errJson('No valid ids');

  const tkUrl = new URL(`${TK_BASE}/prices.php`);
  tkUrl.searchParams.set('ids', ids.join(','));
  tkUrl.searchParams.set('apikey', apiKey);

  const res = await fetch(tkUrl.toString());
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) return errJson(data?.message ?? 'TankerKoenig error', 502);

  return okJson({ ok: true, prices: data.prices ?? {} });
});
