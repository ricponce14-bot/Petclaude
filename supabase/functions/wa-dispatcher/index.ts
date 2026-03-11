// supabase/functions/wa-dispatcher/index.ts
// Edge Function que corre cada minuto — consume la cola wa_messages y envía via Evolution API
// Deploy: supabase functions deploy wa-dispatcher --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!; // http://tu-vps:8080
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async () => {
  // 1. Obtener mensajes pendientes (máx 20 por ejecución)
  const { data: messages, error } = await supabase
    .from("wa_messages")
    .select(`
      id, phone, body, tenant_id,
      wa_sessions!inner(instance, status)
    `)
    .eq("status", "pending")
    .eq("wa_sessions.status", "connected")
    .limit(20);

  if (error) {
    console.error("Error fetching messages:", error);
    return new Response("error", { status: 500 });
  }

  if (!messages?.length) {
    return new Response("no_pending", { status: 200 });
  }

  const results = await Promise.allSettled(
    messages.map(async (msg: any) => {
      const instance = msg.wa_sessions.instance;

      // 2. Enviar mensaje via Evolution API
      const res = await fetch(
        `${EVOLUTION_API_URL}/message/sendText/${instance}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: msg.phone,
            text: msg.body,
            delay: 1200, // delay humanizado en ms
          }),
        }
      );

      const ok = res.ok;

      // 3. Actualizar estado en DB
      await supabase
        .from("wa_messages")
        .update({
          status: ok ? "sent" : "failed",
          sent_at: ok ? new Date().toISOString() : null,
          error: ok ? null : `HTTP ${res.status}`,
        })
        .eq("id", msg.id);

      if (!ok) throw new Error(`Failed for ${msg.phone}: ${res.status}`);
      return msg.id;
    })
  );

  const sent   = results.filter(r => r.status === "fulfilled").length;
  const failed = results.filter(r => r.status === "rejected").length;

  console.log(`Dispatcher: sent=${sent}, failed=${failed}`);
  return new Response(JSON.stringify({ sent, failed }), { status: 200 });
});
