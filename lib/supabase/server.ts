// lib/supabase/server.ts  — cliente para Server Components y Route Handlers
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "./types";

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({ cookies });
};
