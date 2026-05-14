import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[FuelRadar] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.\n' +
    'Copy frontend/.env.example → frontend/.env and fill in your new Supabase project values.\n' +
    'Station data and edge functions will not work until this is configured.',
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
);

// Base URL for fetch-based edge-function calls (edgeGet in api.ts)
export const SUPABASE_FUNCTIONS_URL = supabaseUrl
  ? `${supabaseUrl}/functions/v1`
  : 'https://placeholder.supabase.co/functions/v1';
