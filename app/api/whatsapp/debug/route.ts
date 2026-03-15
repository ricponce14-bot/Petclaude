// app/api/whatsapp/debug/route.ts
// Endpoint de diagnóstico — llama a /api/whatsapp/debug para ver el estado del sistema
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const results: Record<string, any> = {};

  try {
    const supabase = getSupabaseAdmin() as any;

    // 1. Verificar wa_sessions
    const { data: sessions, error: sessErr } = await supabase
      .from("wa_sessions")
      .select("id, instance, status, tenant_id, updated_at")
      .limit(5);
    results.wa_sessions = sessErr ? { error: sessErr.message } : sessions;

    // 2. Verificar si existe la columna direction en wa_messages
    const { data: colCheck, error: colErr } = await supabase.rpc("to_json", {
      v: null
    }).single().catch(() => null);

    // Query directa para verificar columna
    const { data: colData, error: colErr2 } = await supabase
      .from("wa_messages")
      .select("direction")
      .limit(1);
    results.direction_column_exists = colErr2
      ? { error: colErr2.message, hint: "Ejecuta 16_fix_wa_messages_schema.sql en Supabase" }
      : true;

    // 3. Contar mensajes en wa_messages
    const { count, error: countErr } = await supabase
      .from("wa_messages")
      .select("*", { count: "exact", head: true });
    results.wa_messages_total = countErr ? { error: countErr.message } : count;

    // 4. Últimos 3 mensajes
    const { data: lastMsgs, error: lastErr } = await supabase
      .from("wa_messages")
      .select("id, phone, body, direction, type, created_at, tenant_id")
      .order("created_at", { ascending: false })
      .limit(3);
    results.last_3_messages = lastErr ? { error: lastErr.message } : lastMsgs;

    // 5. Bot config
    const { data: botCfg, error: botErr } = await supabase
      .from("bot_config")
      .select("tenant_id, is_enabled, welcome_message")
      .limit(5);
    results.bot_config = botErr ? { error: botErr.message } : botCfg;

    // 6. Variables de entorno (solo verificar si existen, no mostrar valores)
    results.env_vars = {
      EVOLUTION_API_URL: !!process.env.EVOLUTION_API_URL,
      EVOLUTION_API_KEY: !!process.env.EVOLUTION_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // 7. URL del webhook esperada
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ladridoapp.mx";
    results.expected_webhook_url = `${siteUrl}/api/whatsapp/webhook`;

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), ...results });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
