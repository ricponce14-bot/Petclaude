// lib/whatsapp/onboarding.ts
// Activación del DUEÑO por WhatsApp y resolución del código público de clientes.
// Doc sección 11.
//
// - activation_tokens: un solo uso, expira. Vincula el teléfono del dueño.
// - codigo_publico: permanente, reutilizable. Identifica al negocio para
//   clientes finales nuevos.

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export interface ActivationResult {
  ok: boolean;
  tenantId?: string;
  welcome?: string;
  error?: string;
}

/**
 * Valida un token de activación y, si es válido, registra el teléfono como
 * dueño del negocio, marca el token como usado y deja el WhatsApp vinculado.
 */
export async function activateOwner(token: string, phone: string): Promise<ActivationResult> {
  const db = getSupabaseAdmin() as any;

  // 1. Buscar el token (case-insensitive: guardamos/comparamos en mayúsculas).
  const { data: tok } = await db
    .from("activation_tokens")
    .select("token, tenant_id, expires_at, used_at")
    .eq("token", token.toUpperCase())
    .maybeSingle();

  if (!tok) {
    return { ok: false, error: "Ese código de activación no es válido. Genera uno nuevo desde tu panel." };
  }
  if (tok.used_at) {
    return { ok: false, error: "Ese código ya fue usado. Genera uno nuevo desde tu panel si necesitas reactivar." };
  }
  if (new Date(tok.expires_at) < new Date()) {
    return { ok: false, error: "Ese código expiró. Genera uno nuevo desde tu panel (dura 15 minutos)." };
  }

  const tenantId = tok.tenant_id as string;

  // 2. Registrar/actualizar el teléfono como dueño de este negocio.
  const { error: regErr } = await db
    .from("phone_registry")
    .upsert({ telefono: phone, rol: "dueño", tenant_id: tenantId }, { onConflict: "telefono" });
  if (regErr) return { ok: false, error: `No pude vincular tu número: ${regErr.message}` };

  // 3. Marcar el token como usado y vincular el WhatsApp del negocio.
  await db.from("activation_tokens").update({ used_at: new Date().toISOString() }).eq("token", tok.token);
  await db.from("tenants").update({ whatsapp_vinculado: true }).eq("id", tenantId);

  // 4. Asegurar que exista un codigo_publico para el negocio.
  await db.rpc("ensure_codigo_publico", { p_tenant_id: tenantId }).then(() => {}).catch(() => {});

  // 5. Nombre del negocio para personalizar el saludo.
  const { data: tenant } = await db.from("tenants").select("name").eq("id", tenantId).maybeSingle();
  const nombre = tenant?.name ?? "tu negocio";

  const welcome =
    `¡Hola! Soy Mía 🐾, tu asistente para ${nombre}.\n\n` +
    `A partir de ahora puedes escribirme o mandarme un audio para agendar citas, ` +
    `consultar tu disponibilidad, registrar gastos, o preguntarme cuántas citas ` +
    `tienes hoy. ¿Todo listo para empezar?`;

  return { ok: true, tenantId, welcome };
}

/**
 * Resuelve el negocio (tenant) a partir de un código público reutilizable.
 * Devuelve el tenant_id o null si no existe.
 */
export async function resolveTenantByPublicCode(code: string): Promise<string | null> {
  const db = getSupabaseAdmin() as any;
  const { data } = await db
    .from("tenants")
    .select("id")
    .eq("codigo_publico", code.toUpperCase())
    .maybeSingle();
  return data?.id ?? null;
}
