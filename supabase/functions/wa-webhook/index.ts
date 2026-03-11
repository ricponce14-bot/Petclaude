// supabase/functions/wa-webhook/index.ts
// Recibe eventos de Evolution API (conexión QR, mensajes entrantes, etc.)
// Deploy: supabase functions deploy wa-webhook --no-verify-jwt
// Configurar en Evolution API: POST https://tu-proyecto.supabase.co/functions/v1/wa-webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const payload = await req.json();
  const { event, instance, data } = payload;

  console.log(`Webhook: event=${event}, instance=${instance}`);

  switch (event) {
    // QR code generado — guardar para mostrarlo en el dashboard
    case "qrcode.updated": {
      await supabase
        .from("wa_sessions")
        .update({
          status: "qr_needed",
          qr_code: data.qrcode?.base64,
          updated_at: new Date().toISOString(),
        })
        .eq("instance", instance);
      break;
    }

    // Sesión conectada
    case "connection.update": {
      if (data.state === "open") {
        await supabase
          .from("wa_sessions")
          .update({ status: "connected", qr_code: null, updated_at: new Date().toISOString() })
          .eq("instance", instance);
      } else if (data.state === "close") {
        await supabase
          .from("wa_sessions")
          .update({ status: "disconnected", updated_at: new Date().toISOString() })
          .eq("instance", instance);
      }
      break;
    }

    // Mensaje entrante — detectar respuestas CONFIRMAR / CANCELAR / CITA / CUMPLE
    case "messages.upsert": {
      const msg     = data.messages?.[0];
      const fromNum = msg?.key?.remoteJid?.replace("@s.whatsapp.net", "");
      const body    = msg?.message?.conversation?.toUpperCase()?.trim();

      if (!fromNum || msg?.key?.fromMe) break;

      if (body === "CONFIRMAR") {
        // Confirmar próxima cita del número
        const { data: appt } = await supabase
          .from("appointments")
          .select("id, owners!inner(whatsapp)")
          .eq("status", "scheduled")
          .ilike("owners.whatsapp", `%${fromNum}%`)
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .single();

        if (appt) {
          await supabase
            .from("appointments")
            .update({ status: "confirmed" })
            .eq("id", appt.id);
        }
      }

      if (body === "CANCELAR") {
        const { data: appt } = await supabase
          .from("appointments")
          .select("id, owners!inner(whatsapp)")
          .eq("status", "scheduled")
          .ilike("owners.whatsapp", `%${fromNum}%`)
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .single();

        if (appt) {
          await supabase
            .from("appointments")
            .update({ status: "cancelled" })
            .eq("id", appt.id);
        }
      }
      break;
    }
  }

  return new Response("ok", { status: 200 });
});
