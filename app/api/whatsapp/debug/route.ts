// app/api/whatsapp/debug/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const results: Record<string, any> = {};
  const supabase = getSupabaseAdmin() as any;

  // 1. wa_sessions
  const { data: sessions, error: sessErr } = await supabase
    .from("wa_sessions")
    .select("id, instance, status, tenant_id, updated_at")
    .limit(5);
  results.wa_sessions = sessErr ? { error: sessErr.message } : sessions;

  // 2. Verificar columna direction
  const { data: colData, error: colErr } = await supabase
    .from("wa_messages")
    .select("direction")
    .limit(1);
  results.direction_column_exists = colErr
    ? { exists: false, error: colErr.message, fix: "ALTER TABLE wa_messages ADD COLUMN IF NOT EXISTS direction text DEFAULT 'outbound';" }
    : { exists: true };

  // 3. Total de mensajes
  const { count, error: countErr } = await supabase
    .from("wa_messages")
    .select("*", { count: "exact", head: true });
  results.wa_messages_total = countErr ? { error: countErr.message } : count;

  // 4. Últimos 3 mensajes (sin filtrar por tenant — admin bypasses RLS)
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

  // 6. Env vars (solo si existen)
  results.env_vars = {
    EVOLUTION_API_URL: !!process.env.EVOLUTION_API_URL,
    EVOLUTION_API_KEY: !!process.env.EVOLUTION_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  results.expected_webhook_url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://ladridoapp.mx"}/api/whatsapp/webhook`;

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), ...results });
}
