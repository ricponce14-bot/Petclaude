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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

  // Nota: No lanzamos error aquí para permitir que el build de Next.js pase.
  // El error solo ocurrirá en tiempo de ejecución si las variables faltan realmente.

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
