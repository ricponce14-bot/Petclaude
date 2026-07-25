// app/api/whatsapp/activation-link/route.ts
// Genera el link de activación de WhatsApp para el dueño (doc sección 11).
// Devuelve:
//   - link de ACTIVACIÓN (token de un solo uso, expira en 15 min) → vincula al dueño
//   - link PÚBLICO del negocio (codigo_publico permanente) → para clientes finales
// El frontend puede renderizar ambos como QR.

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const CENTRAL_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""; // número central, solo dígitos

function genToken(): string {
  // 6 caracteres alfanuméricos en mayúsculas.
  return Array.from({ length: 6 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
  ).join("");
}

/**
 * GET: estado de vinculación del negocio (sin generar tokens).
 * Devuelve whatsapp_vinculado, el código público (si existe) y cuántos
 * teléfonos de dueño están registrados.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantId = session.user.app_metadata?.tenant_id;
    if (!tenantId) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 400 });

    const db = getSupabaseAdmin() as any;

    const { data: tenant } = await db
      .from("tenants")
      .select("name, whatsapp_vinculado, codigo_publico")
      .eq("id", tenantId)
      .maybeSingle();

    const { count: duenos } = await db
      .from("phone_registry")
      .select("telefono", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("rol", "dueño");

    const base = CENTRAL_NUMBER ? `https://wa.me/${CENTRAL_NUMBER}` : null;
    const publicLink =
      base && tenant?.codigo_publico
        ? `${base}?text=${encodeURIComponent(tenant.codigo_publico)}`
        : null;

    return NextResponse.json({
      ok: true,
      negocio: tenant?.name ?? null,
      vinculado: Boolean(tenant?.whatsapp_vinculado),
      duenos: duenos ?? 0,
      public: tenant?.codigo_publico
        ? { codigo: tenant.codigo_publico, link: publicLink }
        : null,
      central_number: CENTRAL_NUMBER || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tenantId = session.user.app_metadata?.tenant_id;
    if (!tenantId) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 400 });

    const db = getSupabaseAdmin() as any;

    // 1. Generar token de activación (un solo uso, expira en 15 min).
    const token = genToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error: insErr } = await db.from("activation_tokens").insert({
      token,
      tenant_id: tenantId,
      expires_at: expiresAt,
    });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    // 2. Asegurar codigo_publico permanente del negocio.
    const { data: codeData } = await db.rpc("ensure_codigo_publico", { p_tenant_id: tenantId });
    let codigoPublico: string | null = typeof codeData === "string" ? codeData : null;
    if (!codigoPublico) {
      const { data: t } = await db.from("tenants").select("codigo_publico").eq("id", tenantId).maybeSingle();
      codigoPublico = t?.codigo_publico ?? null;
    }

    const base = CENTRAL_NUMBER ? `https://wa.me/${CENTRAL_NUMBER}` : "https://wa.me/";
    const activationLink = `${base}?text=${encodeURIComponent(`ACTIVAR-${token}`)}`;
    const publicLink = codigoPublico
      ? `${base}?text=${encodeURIComponent(codigoPublico)}`
      : null;

    return NextResponse.json({
      ok: true,
      activation: { token, expires_at: expiresAt, link: activationLink },
      public: codigoPublico ? { codigo: codigoPublico, link: publicLink } : null,
      central_number: CENTRAL_NUMBER || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
