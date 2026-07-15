import { createClient } from "@supabase/supabase-js";

// These come from your .env file (see .env.example).
// VITE_ variables are safe to expose in the browser -- the anon key
// only allows what your Row Level Security policies permit (see sql/schema.sql).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
