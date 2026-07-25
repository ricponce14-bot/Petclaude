// lib/whatsapp/cloud-client.ts
// Cliente oficial de WhatsApp Business Platform (Cloud API de Meta).
// Reemplaza por completo a Evolution API. Un solo número centralizado (una WABA).
// Doc: sección 3 (infraestructura crítica).
//
// Env requeridas:
//   WHATSAPP_TOKEN            -> token permanente del System User
//   WHATSAPP_PHONE_NUMBER_ID  -> phone_number_id del número central
//   WHATSAPP_API_VERSION      -> opcional, default "v20.0"

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";
const GRAPH = "https://graph.facebook.com";

function cfg() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    const missing = [
      !token && "WHATSAPP_TOKEN",
      !phoneNumberId && "WHATSAPP_PHONE_NUMBER_ID",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`[Cloud API] Variables de entorno faltantes: ${missing}`);
  }
  return { token, phoneNumberId };
}

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * POST genérico al endpoint /messages del número central.
 */
async function postMessage(payload: Record<string, any>): Promise<SendResult> {
  const { token, phoneNumberId } = cfg();
  try {
    const res = await fetch(`${GRAPH}/${API_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = json?.error?.message || JSON.stringify(json);
      console.error("[Cloud API] Error al enviar:", err);
      return { ok: false, error: err };
    }
    return { ok: true, messageId: json?.messages?.[0]?.id };
  } catch (err: any) {
    console.error("[Cloud API] Excepción al enviar:", err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Mensaje de texto libre. Solo válido DENTRO de la ventana de 24h
 * (el cliente escribió primero). Fuera de la ventana usar plantillas.
 */
export function sendText(to: string, body: string, previewUrl = false): Promise<SendResult> {
  return postMessage({
    to: normalizePhone(to),
    type: "text",
    text: { preview_url: previewUrl, body },
  });
}

export interface ReplyButton {
  id: string;
  title: string; // máx 20 caracteres
}

/**
 * Mensaje interactivo con botones de respuesta rápida (máx 3).
 * No requiere plantilla porque va dentro de la ventana de 24h.
 */
export function sendButtons(
  to: string,
  body: string,
  buttons: ReplyButton[],
  header?: string,
  footer?: string
): Promise<SendResult> {
  return postMessage({
    to: normalizePhone(to),
    type: "interactive",
    interactive: {
      type: "button",
      ...(header ? { header: { type: "text", text: header } } : {}),
      body: { text: body },
      ...(footer ? { footer: { text: footer } } : {}),
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

export interface ListRow {
  id: string;
  title: string; // máx 24
  description?: string; // máx 72
}
export interface ListSection {
  title?: string;
  rows: ListRow[];
}

/**
 * Mensaje interactivo tipo lista (menús de servicios, horarios, etc.).
 */
export function sendList(
  to: string,
  body: string,
  buttonText: string,
  sections: ListSection[],
  header?: string,
  footer?: string
): Promise<SendResult> {
  return postMessage({
    to: normalizePhone(to),
    type: "interactive",
    interactive: {
      type: "list",
      ...(header ? { header: { type: "text", text: header } } : {}),
      body: { text: body },
      ...(footer ? { footer: { text: footer } } : {}),
      action: {
        button: buttonText.slice(0, 20),
        sections: sections.map((s) => ({
          ...(s.title ? { title: s.title.slice(0, 24) } : {}),
          rows: s.rows.map((r) => ({
            id: r.id,
            title: r.title.slice(0, 24),
            ...(r.description ? { description: r.description.slice(0, 72) } : {}),
          })),
        })),
      },
    },
  });
}

/**
 * Envía una plantilla aprobada (categoría utility). Necesario para iniciar
 * conversación FUERA de la ventana de 24h (recordatorios, resumen diario, etc.).
 * Doc: sección 8.
 */
export function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components?: any[]
): Promise<SendResult> {
  return postMessage({
    to: normalizePhone(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  });
}

/**
 * Marca un mensaje entrante como leído (los dos checks azules).
 */
export async function markAsRead(messageId: string): Promise<void> {
  await postMessage({ status: "read", message_id: messageId }).catch(() => {});
}

/**
 * Descarga un archivo de media (audio/imagen) por su media ID.
 * Paso 1: resolver la URL temporal. Paso 2: descargar el binario con el token.
 * Devuelve el buffer y el mime type. Doc: sección 7 (STT).
 */
export async function downloadMedia(
  mediaId: string
): Promise<{ buffer: ArrayBuffer; mimeType: string } | null> {
  const { token } = cfg();
  try {
    const metaRes = await fetch(`${GRAPH}/${API_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metaRes.ok) {
      console.error("[Cloud API] No se pudo resolver la URL del media:", await metaRes.text());
      return null;
    }
    const meta = (await metaRes.json()) as { url: string; mime_type: string };

    const binRes = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!binRes.ok) {
      console.error("[Cloud API] No se pudo descargar el media:", binRes.status);
      return null;
    }
    return { buffer: await binRes.arrayBuffer(), mimeType: meta.mime_type };
  } catch (err: any) {
    console.error("[Cloud API] Excepción al descargar media:", err.message);
    return null;
  }
}

/**
 * Normaliza a formato E.164 sin "+" (como espera la Cloud API).
 * Meta acepta el número con o sin +, pero normalizamos por consistencia.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}
