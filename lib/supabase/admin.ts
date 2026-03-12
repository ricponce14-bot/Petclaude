// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Crea un cliente de Supabase con el Service Role Key.
 * Se usa una función para evitar inicializarlo en el top-level del archivo,
 * lo cual previene errores durante el build de Vercel si las variables
 * de entorno no están presentes en tiempo de compilación.
 */
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // Durante el build de Next.js, estas variables pueden no estar.
    // Retornamos null o lanzamos error solo cuando realmente se intenta usar.
    throw new Error("Missing Supabase admin environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
