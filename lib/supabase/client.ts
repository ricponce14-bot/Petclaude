// lib/supabase/client.ts  — cliente para componentes del browser
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./types";

export const createClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder",
  });
};
