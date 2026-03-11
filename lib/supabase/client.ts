// lib/supabase/client.ts  — cliente para componentes del browser
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./types";

export const createClient = () =>
  createClientComponentClient<Database>();
