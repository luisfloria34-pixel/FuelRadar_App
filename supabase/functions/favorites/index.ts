// Edge Function: favorites
// CRUD for favorite_stations table — requires service role to bypass RLS.
//
// GET    /functions/v1/favorites?device_uuid=xxx         → list favorites
// POST   /functions/v1/favorites?device_uuid=xxx  + body → add favorite
// DELETE /functions/v1/favorites?device_uuid=xxx&station_id=xxx → remove

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, okJson, errJson } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const device_uuid = url.searchParams.get('device_uuid');
  if (!device_uuid) return errJson('device_uuid is required');

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('favorite_stations')
        .select('*')
        .eq('device_uuid', device_uuid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return okJson(data ?? []);
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { station_id, station_name, station_brand, lat, lng } = body;
      if (!station_id || !station_name) return errJson('station_id and station_name are required');

      const { data, error } = await supabase
        .from('favorite_stations')
        .insert({ device_uuid, station_id, station_name, station_brand, lat, lng })
        .select()
        .single();

      if (error) {
        // 23505 = unique constraint — already favorited, return existing row
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('favorite_stations')
            .select('*')
            .eq('device_uuid', device_uuid)
            .eq('station_id', station_id)
            .single();
          return okJson(existing);
        }
        throw error;
      }
      return okJson(data);
    }

    if (req.method === 'DELETE') {
      const station_id = url.searchParams.get('station_id');
      if (!station_id) return errJson('station_id is required');
      const { error } = await supabase
        .from('favorite_stations')
        .delete()
        .eq('device_uuid', device_uuid)
        .eq('station_id', station_id);
      if (error) throw error;
      return okJson({ ok: true });
    }

    return errJson('Method not allowed', 405);
  } catch (err: any) {
    console.error('[favorites]', err);
    return errJson(err?.message ?? 'Internal error', 500);
  }
});
