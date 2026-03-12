// lib/supabase/server.ts  — cliente para Server Components y Route Handlers
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "./types";

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>(
    { cookies },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder",
    }
  );
};
