// suiarko/gll/GLL-b80dc408f336c7996361a0b636597efaa1a04042/supabaseClient.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// FIX: Using `process.env` to get Supabase credentials. This avoids TypeScript errors
// with `import.meta.env` if the project's tsconfig isn't set up for Vite,
// and it's compatible with both Vite (with configuration) and Create React App.
// The original code used VITE_ prefixes, so we'll keep them.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabaseSingleton: SupabaseClient | null = null;

// Initialize Supabase client if credentials are available in environment variables.
// This allows for a pre-configured setup, with the UI as a fallback.
if (supabaseUrl && supabaseKey) {
  supabaseSingleton = createClient(supabaseUrl, supabaseKey);
}

// FIX: Exporting supabaseConnection and initializeSupabase as expected by App.tsx.
// This object holds the client instance, which can be null initially.
export const supabaseConnection = {
  client: supabaseSingleton,
};

// This function allows for initializing or re-initializing the Supabase client at runtime.
export const initializeSupabase = (url: string, key: string): SupabaseClient => {
  const newClient = createClient(url, key);
  supabaseConnection.client = newClient; // Update the client in the connection object
  return newClient;
};
