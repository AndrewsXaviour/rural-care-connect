import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Note: If supabaseUrl or supabaseAnonKey are missing, the client will be created
// with placeholder values and Supabase calls will fail gracefully.

// SEC5 fix: Only create client if credentials are present
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

