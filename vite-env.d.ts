interface ImportMetaEnv {
  VITE_GEMINI_API_KEY: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}
interface ImportMeta {
  env: ImportMetaEnv;
}
