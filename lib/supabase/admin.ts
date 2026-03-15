// lib/supabase/admin.ts - Utility for lazy loading supabase admin
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
    const missing = [
      !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
      !supabaseServiceKey && "SUPABASE_SERVICE_ROLE_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `[Supabase Admin] Variables de entorno faltantes: ${missing}. ` +
        `Configúralas en .env.local o en las variables de entorno de Vercel.`
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
