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

  // 3. Conteo de mensajes por tenant
  const { data: countByTenant, error: countErr } = await supabase
    .from("wa_messages")
    .select("tenant_id")
    .order("created_at", { ascending: false })
    .limit(500);

  if (!countErr && countByTenant) {
    const tally: Record<string, number> = {};
    for (const r of countByTenant) {
      tally[r.tenant_id] = (tally[r.tenant_id] || 0) + 1;
    }
    results.messages_per_tenant = tally;
  }

  // 4. Últimos 5 mensajes (sin filtrar — admin bypasses RLS)
  const { data: lastMsgs, error: lastErr } = await supabase
    .from("wa_messages")
    .select("id, phone, body, direction, type, created_at, tenant_id")
    .order("created_at", { ascending: false })
    .limit(5);
  results.last_5_messages = lastErr ? { error: lastErr.message } : lastMsgs;

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
