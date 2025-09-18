
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// NOTE: This application will check for Supabase credentials in environment variables first.
// If not found, it will check localStorage.
// If they are not found there either, the application will prompt the user to enter them.

let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_KEY;

// Fallback to localStorage if environment variables are not set
if (!supabaseUrl || !supabaseKey) {
  try {
    supabaseUrl = localStorage.getItem('SUPABASE_URL');
    supabaseKey = localStorage.getItem('SUPABASE_KEY');
  } catch (error) {
    // localStorage might be disabled (e.g., in private browsing)
    console.warn('Could not access localStorage. Supabase credentials must be provided manually.', error);
  }
}

class SupabaseConnection {
  client: SupabaseClient | null = null;
}

export const supabaseConnection = new SupabaseConnection();

// Initialize the client if credentials were found
if (supabaseUrl && supabaseKey) {
  supabaseConnection.client = createClient(supabaseUrl, supabaseKey);
}

export const initializeSupabase = (url: string, key: string): SupabaseClient => {
  // This function is for when the user enters credentials manually.
  // It saves them to localStorage for persistence and creates the client.
  try {
    localStorage.setItem('SUPABASE_URL', url);
    localStorage.setItem('SUPABASE_KEY', key);
  } catch (error) {
    console.warn('Could not save Supabase credentials to localStorage.', error);
  }
  
  const client = createClient(url, key);
  supabaseConnection.client = client;
  return client;
};
