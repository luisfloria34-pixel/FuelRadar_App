import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('[FuelRadar] Missing Supabase env vars. Copy .env.example → .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
);

// Base URL for fetch-based Edge Function calls.
export const SUPABASE_FUNCTIONS_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (supabaseUrl
    ? `${supabaseUrl}/functions/v1`
    : 'https://placeholder.supabase.co/functions/v1');
