// app/api/whatsapp/webhook/route.ts
// Endpoint que recibe mensajes entrantes desde Evolution API

import { NextResponse } from "next/server";
import { processMessage } from "@/lib/whatsapp-bot/engine";
import { sendBotReply, logBotMessage } from "@/lib/whatsapp-bot/sender";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1. Verificar autenticación — Evolution API envía la apikey en el header


    // 2. Parsear el payload de Evolution API
    const payload = await req.json();

    // Evolution API envía diferentes eventos, solo nos interesan mensajes nuevos
    const event = payload.event?.toLowerCase();
    if (event !== "messages.upsert" && payload.event !== "MESSAGES_UPSERT") {
      return NextResponse.json({ ok: true, ignored: true, event: payload.event });
    }

    const data = payload.data;
    if (!data) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // 3. Filtrar mensajes propios (fromMe = true → es nuestro mensaje saliente)
    const key = data.key;
    if (key?.fromMe) {
      return NextResponse.json({ ok: true, ignored: "own message" });
    }

    // 4. Extraer información del mensaje
    const instanceName = payload.instance;
    const remoteJid = key?.remoteJid;
    const messageContent = data.message?.conversation
      || data.message?.extendedTextMessage?.text
      || "";

    if (!instanceName || !remoteJid || !messageContent) {
      return NextResponse.json({ ok: true, ignored: "incomplete data" });
    }

    // Solo procesar chats individuales (no grupos)
    if (remoteJid.includes("@g.us")) {
      return NextResponse.json({ ok: true, ignored: "group message" });
    }

    // Limpiar el número de teléfono (remover @s.whatsapp.net)
    const phone = remoteJid.replace("@s.whatsapp.net", "");

    // 5. Identificar el tenant por la instancia de WhatsApp
    const { data: waSession } = await supabaseAdmin
      .from("wa_sessions")
      .select("tenant_id, instance")
      .eq("instance", instanceName)
      .eq("status", "connected")
      .returns<any>()
      .single();

    if (!waSession) {
      console.warn(`[Webhook] No tenant found for instance: ${instanceName}`);
      return NextResponse.json({ ok: true, ignored: "no tenant" });
    }

    const tenantId = (waSession as any).tenant_id;
    console.log(`[Webhook] Routing message to tenant: ${tenantId}`);

    // 6. Loguear el mensaje entrante inmediatamente (para que aparezca en el chat en vivo aunque el bot no responda)
    await logBotMessage(tenantId, phone, messageContent, "inbound");

    // 7. Procesar con el motor del bot
    const botResponse = await processMessage(phone, messageContent, tenantId);

    if (!botResponse) {
      console.log(`[Webhook] Bot disabled or no response for ${phone}`);
      return NextResponse.json({ ok: true, bot_disabled: true });
    }

    // 8. Enviar respuesta directamente via Evolution API
    const sendResult = await sendBotReply(instanceName, phone, botResponse.reply);

    // 9. Loguear el mensaje de respuesta
    if (sendResult.ok) {
      await logBotMessage(tenantId, phone, botResponse.reply, "outbound");
    }

    return NextResponse.json({
      ok: true,
      sent: sendResult.ok,
      sessionId: botResponse.sessionId
    });

  } catch (error: any) {
    console.error("[Webhook] Error processing incoming message:", error);
    // SIEMPRE retornar 200 al webhook para evitar reintentos de Evolution API
    return NextResponse.json({ ok: false, error: error.message });
  }
}

// GET para health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "whatsapp-bot-webhook",
    timestamp: new Date().toISOString()
  });
}
