// lib/supabase/client.ts  — cliente para componentes del browser
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./types";

export const createClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder-url.supabase.co";
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder-key";
  }
  return createClientComponentClient<Database>();
};
