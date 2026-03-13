// lib/whatsapp-bot/sender.ts
// Módulo para enviar respuestas del bot directamente a Evolution API y loguear en BD

import { createClient } from "@supabase/supabase-js";
import type { WaMessageType } from "@/lib/supabase/types";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Envía un mensaje directamente a Evolution API (sin pasar por la cola)
 * Usado para respuestas del bot que necesitan ser inmediatas
 */
export async function sendBotReply(
  instanceName: string,
  phone: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const apiUrl = process.env.EVOLUTION_API_URL!;
  const apiKey = process.env.EVOLUTION_API_KEY!;

  try {
    const res = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey
      },
      body: JSON.stringify({
        number: phone,
        text: text,
        delay: 1200 // mismo delay que el sistema actual
      })
    });

    if (res.ok) {
      return { ok: true };
    } else {
      const errText = await res.text();
      console.error(`[Bot Sender] Error enviando a ${phone}:`, errText);
      return { ok: false, error: errText };
    }
  } catch (err: any) {
    console.error(`[Bot Sender] Exception:`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Registra un mensaje del bot (entrante o saliente) en wa_messages para tracking
 */
export async function logBotMessage(
  tenantId: string,
  phone: string,
  text: string,
  direction: "inbound" | "outbound",
  type: WaMessageType = direction === "inbound" ? "bot_incoming" : "bot_reply"
): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from("wa_messages").insert({
      tenant_id: tenantId,
      type: type,
      phone: phone,
      body: text,
      direction: direction,
      status: direction === "outbound" ? "sent" : "sent",
    } as any);
  } catch (err: any) {
    // Log pero no fallar — el mensaje ya se envió, el log es secundario
    console.error(`[Bot Sender] Error logging message:`, err.message);
  }
}
