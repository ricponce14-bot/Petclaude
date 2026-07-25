// lib/whatsapp/router.ts
// Enrutamiento de mensajes entrantes (doc sección 5).
// Resuelve rol/tenant por phone_registry; para clientes nuevos, por el código
// embebido en el link wa.me (?text=ACTIVAR-xxxx  ó  ?text=CODIGOPUBLICO).

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { QueueRow } from "@/lib/whatsapp/queue";
import { sendText, markAsRead } from "@/lib/whatsapp/cloud-client";
import { transcribeAudio } from "@/lib/whatsapp/stt";
import { runMia } from "@/lib/mia/mia_intent_service";
import { activateOwner, resolveTenantByPublicCode } from "@/lib/whatsapp/onboarding";
import { processMessage } from "@/lib/whatsapp-bot/engine";

// ============================================================
// Extracción del texto del mensaje según su tipo
// ============================================================
interface ExtractedMessage {
  text: string | null; // texto listo para el LLM (transcrito si era audio)
  isAudio: boolean;
  unsupported: boolean;
}

async function extractText(row: QueueRow): Promise<ExtractedMessage> {
  const m = row.raw || {};
  switch (row.msg_type) {
    case "text":
      return { text: m.text?.body ?? null, isAudio: false, unsupported: false };

    case "interactive": {
      // Respuesta a botón o a lista
      const btn = m.interactive?.button_reply;
      const list = m.interactive?.list_reply;
      // Usamos el id (lo controlamos nosotros) y caemos al title si hace falta.
      const value = btn?.id || btn?.title || list?.id || list?.title || null;
      return { text: value, isAudio: false, unsupported: false };
    }

    case "button": {
      // Respuesta a botón de plantilla (quick reply)
      return { text: m.button?.payload || m.button?.text || null, isAudio: false, unsupported: false };
    }

    case "audio": {
      const mediaId = m.audio?.id;
      if (!mediaId) return { text: null, isAudio: true, unsupported: false };
      const transcript = await transcribeAudio(mediaId);
      return { text: transcript, isAudio: true, unsupported: false };
    }

    default:
      return { text: null, isAudio: false, unsupported: true };
  }
}

// ============================================================
// Log de conversación (doc sección 4: conversation_log)
// Reutilizamos wa_messages con direction + tipos bot_*.
// ============================================================
async function logConversation(
  tenantId: string,
  phone: string,
  body: string,
  direction: "inbound" | "outbound"
): Promise<void> {
  try {
    const db = getSupabaseAdmin() as any;
    await db.from("wa_messages").insert({
      tenant_id: tenantId,
      phone,
      body,
      direction,
      type: direction === "inbound" ? "bot_incoming" : "bot_reply",
      status: "sent",
    });
  } catch (err: any) {
    console.error("[Router] Error logging conversación:", err.message);
  }
}

interface PhoneRegistryRow {
  telefono: string;
  rol: "dueño" | "cliente";
  tenant_id: string;
}

async function lookupPhone(phone: string): Promise<PhoneRegistryRow | null> {
  const db = getSupabaseAdmin() as any;
  const { data } = await db
    .from("phone_registry")
    .select("telefono, rol, tenant_id")
    .eq("telefono", phone)
    .maybeSingle();
  return (data as PhoneRegistryRow) || null;
}

/**
 * Detecta un código embebido en el primer mensaje de un contacto nuevo.
 * - "ACTIVAR-<token>"  -> activación del DUEÑO (token de un solo uso)
 * - cualquier otra palabra suelta -> posible codigo_publico de cliente
 */
function parseCode(text: string | null): { kind: "activation" | "public" | null; code: string } {
  if (!text) return { kind: null, code: "" };
  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  const actMatch = upper.match(/ACTIVAR[-\s]([A-Z0-9]+)/);
  if (actMatch) return { kind: "activation", code: actMatch[1] };

  // Un solo token alfanumérico (sin espacios) parece un código público.
  if (/^[A-Z0-9][A-Z0-9\-]{2,}$/.test(upper) && !upper.includes(" ")) {
    return { kind: "public", code: upper };
  }
  return { kind: null, code: "" };
}

// ============================================================
// Punto de entrada del worker
// ============================================================
export async function handleInboundMessage(row: QueueRow): Promise<void> {
  const phone = row.from_phone;

  // Marcar como leído cuanto antes (no bloquea si falla).
  if (row.message_id) void markAsRead(row.message_id);

  const extracted = await extractText(row);

  // 1. ¿Está registrado el teléfono?
  const registry = await lookupPhone(phone);

  // 2. Contacto NO registrado: intentar resolver por código del link wa.me
  if (!registry) {
    const { kind, code } = parseCode(extracted.text);

    if (kind === "activation") {
      const result = await activateOwner(code, phone);
      if (result.ok) {
        await logConversation(result.tenantId!, phone, extracted.text || "", "inbound");
        await sendText(phone, result.welcome!);
        await logConversation(result.tenantId!, phone, result.welcome!, "outbound");
      } else {
        await sendText(phone, result.error!);
      }
      return;
    }

    if (kind === "public") {
      const tenantId = await resolveTenantByPublicCode(code);
      if (tenantId) {
        // Registrar como cliente y continuar con el bot de agendamiento.
        const db = getSupabaseAdmin() as any;
        await db
          .from("phone_registry")
          .upsert({ telefono: phone, rol: "cliente", tenant_id: tenantId }, { onConflict: "telefono" });
        await routeToClient(tenantId, phone, extracted);
        return;
      }
    }

    // No pudimos resolver a qué negocio escribe.
    await sendText(
      phone,
      "¡Hola! 👋 Para atenderte necesito saber a qué negocio le escribes. " +
        "Por favor usa el enlace o QR que te compartió el negocio para iniciar la conversación."
    );
    return;
  }

  // 3. Contacto registrado: enrutar por rol.
  if (extracted.unsupported) {
    await sendText(phone, "Por ahora solo puedo procesar mensajes de texto o notas de voz 🙏");
    return;
  }
  if (extracted.isAudio && !extracted.text) {
    await sendText(phone, "No pude entender la nota de voz 😅. ¿Me la escribes o la mandas de nuevo?");
    return;
  }
  if (!extracted.text) return;

  if (registry.rol === "dueño") {
    await routeToOwner(registry.tenant_id, phone, extracted.text);
  } else {
    await routeToClient(registry.tenant_id, phone, extracted);
  }
}

// ============================================================
// Dueño -> asistente Mía (function calling)
// ============================================================
async function routeToOwner(tenantId: string, phone: string, text: string): Promise<void> {
  await logConversation(tenantId, phone, text, "inbound");
  const reply = await runMia({ tenantId, phone, message: text });
  if (reply) {
    await sendText(phone, reply);
    await logConversation(tenantId, phone, reply, "outbound");
  }
}

// ============================================================
// Cliente final -> bot de agendamiento conversacional
// ============================================================
async function routeToClient(tenantId: string, phone: string, extracted: ExtractedMessage): Promise<void> {
  if (!extracted.text) {
    await sendText(phone, "No pude entender tu mensaje 😅. ¿Me lo escribes de nuevo?");
    return;
  }
  await logConversation(tenantId, phone, extracted.text, "inbound");
  const botResponse = await processMessage(phone, extracted.text, tenantId);
  if (botResponse?.reply) {
    await sendText(phone, botResponse.reply);
    await logConversation(tenantId, phone, botResponse.reply, "outbound");
  }
}
