import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Check your .env file.");
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);

if (supabaseUrl) {
  console.log("⚡ Supabase client initialized:", new URL(supabaseUrl).hostname);
  
  // Quick sanity check (optional but helpful for the user)
  supabase.from('hospitals').select('id', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error("❌ Supabase Database connection error:", error.message);
      } else {
        console.log("✅ Supabase Database connected and reachable.");
      }
    });
}

