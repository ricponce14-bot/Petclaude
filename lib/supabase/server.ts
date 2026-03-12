// lib/supabase/server.ts  — cliente para Server Components y Route Handlers
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "./types";

export const createServerSupabaseClient = () => {
  // Aseguramos fallbacks para evitar errores durante el build de Next.js
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder-url.supabase.co";
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder-key";
  }

  return createServerComponentClient<Database>({ cookies });
};
