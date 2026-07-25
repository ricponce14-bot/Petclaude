// app/api/whatsapp/webhook/route.ts
// Webhook oficial de WhatsApp Cloud API (Meta).
// Doc sección 5: parsear -> encolar -> responder 200 OK inmediato.
// NUNCA hacer trabajo pesado (STT/LLM) aquí de forma síncrona.

import { NextResponse } from "next/server";
import { enqueueInbound, kickWorker } from "@/lib/whatsapp/queue";

export const runtime = "nodejs";

// ============================================================
// GET: verificación del webhook (Meta lo llama una vez al configurar)
// ============================================================
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    console.log("[Webhook] Verificación de Meta exitosa");
    // Meta espera el challenge como texto plano
    return new Response(challenge, { status: 200 });
  }

  console.warn("[Webhook] Verificación fallida (token no coincide)");
  return new Response("Forbidden", { status: 403 });
}

// ============================================================
// POST: eventos entrantes de Meta
// ============================================================
export async function POST(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    // Nunca hacer que Meta reintente por un body malformado
    return NextResponse.json({ ok: true });
  }

  try {
    // Estructura Meta: entry[].changes[].value.{messages,statuses,metadata,contacts}
    const entries = payload?.entry || [];
    let enqueued = 0;

    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        const value = change?.value;
        if (!value) continue;

        const phoneNumberId = value?.metadata?.phone_number_id;
        const contacts = value?.contacts || [];

        // Solo nos interesan mensajes entrantes (ignoramos statuses de entrega aquí;
        // se pueden encolar aparte si se quiere tracking fino).
        for (const message of value?.messages || []) {
          await enqueueInbound({
            phoneNumberId,
            from: message.from,
            contactName: contacts?.[0]?.profile?.name ?? null,
            messageId: message.id,
            type: message.type,
            raw: message,
          });
          enqueued++;
        }
      }
    }

    // Disparar el worker sin bloquear la respuesta a Meta.
    if (enqueued > 0) {
      kickWorker(); // fire-and-forget
    }

    // 200 OK inmediato — no bloquear con lógica pesada (doc sección 5).
    return NextResponse.json({ ok: true, enqueued });
  } catch (error: any) {
    console.error("[Webhook] Error encolando evento:", error?.message);
    // Aún así responder 200 para evitar reintentos duplicados de Meta.
    return NextResponse.json({ ok: true });
  }
}
