// lib/whatsapp-bot/engine.ts
// Motor principal del bot — orquesta el flujo de conversación

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { BotConfig, WhatsappChatSession, ChatState } from "@/lib/supabase/types";
import {
  handleInicio,
  handleSeleccionarServicio,
  handleSeleccionarFecha,
  handleSeleccionarHora,
  handleConfirmar,
  handleEsperandoConfirmacion,
  handleReagendarSeleccionar,
  handleReagendarFecha,
  handleReagendarHora,
  type HandlerResult
} from "./handlers";
import { classifyIntent } from "./ai-intent-router";

export interface BotResponse {
  reply: string;
  sessionId: string;
}

/**
 * Procesa un mensaje entrante y retorna la respuesta del bot
 */
export async function processMessage(
  phone: string,
  text: string,
  tenantId: string
): Promise<BotResponse | null> {
  // 1. Obtener configuración del bot para este tenant
  const config = await getBotConfig(tenantId);
  if (!config) {
    console.warn(`[Engine] Sin bot_config para tenant ${tenantId}, mensaje ignorado`);
    return null;
  }
  if (!config.is_enabled) {
    console.log(`[Engine] Bot desactivado para tenant ${tenantId}, mensaje ignorado`);
    return null;
  }

  // 2. Buscar o crear sesión de conversación
  let session = await getOrCreateSession(phone, tenantId);

  // 3. Verificar si la sesión expiró → reiniciar
  if (new Date(session.expires_at) < new Date()) {
    session = await resetSession(session.id, tenantId, phone);
  }

  // 4. Procesar el mensaje según el estado actual
  const result = await routeToHandler(session, text, config, tenantId);

  // 5. Actualizar la sesión con el nuevo estado
  const sessionUpdates = {
    state: result.newState,
    last_message_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    ...(result.updates || {})
  };

  await updateSession(session.id, sessionUpdates);

  return {
    reply: result.reply,
    sessionId: session.id
  };
}

/**
 * Inicia una sesión de confirmación de recordatorio para una cita específica.
 * Llamado por el cron de recordatorios mejorado.
 */
export async function startReminderConfirmation(
  phone: string,
  tenantId: string,
  appointmentId: string
): Promise<void> {
  const session = await getOrCreateSession(phone, tenantId);

  await updateSession(session.id, {
    state: "esperando_confirmacion" as ChatState,
    selected_service: appointmentId,
    last_message_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
}

// ============================================================
// Funciones internas
// ============================================================

async function getBotConfig(tenantId: string): Promise<BotConfig | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("bot_config")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (error) {
    console.error(`[Engine] Error al obtener bot_config para tenant ${tenantId}:`, error.message);
    return null;
  }
  if (!data) {
    console.warn(`[Engine] No existe bot_config para tenant ${tenantId}`);
    return null;
  }

  const config = data as any;
  try {
    return {
      ...config,
      services: typeof config.services === "string" ? JSON.parse(config.services) : config.services,
      business_hours: typeof config.business_hours === "string" ? JSON.parse(config.business_hours) : config.business_hours,
    } as BotConfig;
  } catch (parseErr) {
    console.error(`[Engine] Error al parsear JSON de bot_config para tenant ${tenantId}:`, parseErr);
    return null;
  }
}

async function getOrCreateSession(
  phone: string,
  tenantId: string
): Promise<WhatsappChatSession> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: existing } = await supabaseAdmin
    .from("whatsapp_chat_sessions")
    .select("*")
    .eq("phone", phone)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return existing as WhatsappChatSession;
  }

  const { data: newSession, error } = await supabaseAdmin
    .from("whatsapp_chat_sessions")
    .insert({
      tenant_id: tenantId,
      phone: phone,
      state: "inicio" as ChatState,
      last_message_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    } as any)
    .select()
    .returns<any>()
    .single();

  if (error) {
    throw new Error(`Error creating chat session: ${error.message}`);
  }

  return newSession as WhatsappChatSession;
}

async function resetSession(
  sessionId: string,
  _tenantId: string,
  _phone: string
): Promise<WhatsappChatSession> {
  const supabaseAdmin = getSupabaseAdmin();
  const db = supabaseAdmin as any;
  const { data, error } = await db
    .from("whatsapp_chat_sessions")
    .update({
      state: "inicio",
      selected_service: null,
      selected_date: null,
      selected_time: null,
      selected_pet_id: null,
      last_message_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Error resetting session: ${error?.message}`);
  }

  return data as WhatsappChatSession;
}

async function updateSession(
  sessionId: string,
  updates: Partial<WhatsappChatSession>
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const db = supabaseAdmin as any;
  const { error } = await db
    .from("whatsapp_chat_sessions")
    .update(updates)
    .eq("id", sessionId);

  if (error) {
    console.error("[Engine] Error updating session:", error);
  } else {
    console.log("[Engine] Session updated:", sessionId, updates);
  }
}

async function routeToHandler(
  session: WhatsappChatSession,
  text: string,
  config: BotConfig,
  tenantId: string
): Promise<HandlerResult> {
  // Re-leer sesión fresca para estados con posible race condition
  const statesNeedingFresh: ChatState[] = ["confirmar", "seleccionar_hora", "seleccionar_fecha"];
  if (statesNeedingFresh.includes(session.state)) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: freshSession } = await supabaseAdmin
      .from("whatsapp_chat_sessions")
      .select("*")
      .eq("id", session.id)
      .maybeSingle();
    if (freshSession) session = freshSession as WhatsappChatSession;
  }

  // AI Intent Router — solo activo en estados de entrada libre
  if (session.state === "inicio" || session.state === "finalizado") {
    const aiResult = await classifyIntent(text, config.welcome_message.split("*")[1] ?? "Ladrido", config.services);
    if (aiResult && aiResult.confidence === "high") {
      switch (aiResult.intent) {
        case "agendar_cita":
          // Saltar el menú e ir directo a selección de servicio
          return handleSeleccionarServicio("__ai_trigger__", config);
        case "reagendar_cita":
          // Ir directo al flujo de reagendar
          return handleReagendarSeleccionar("1", config, tenantId, { ...session, state: "reagendar_seleccionar" });
        case "consultar_precios":
          // Construir lista de precios desde bot_config
          const priceLines = config.services
            .map((s) => `• ${s.label}: $${s.price} MXN`)
            .join("\n");
          return {
            reply: `💈 *Servicios y precios*\n\n${priceLines}\n\n¿Quieres agendar una cita? Responde *1* o escríbeme 🐾`,
            newState: "inicio",
          };
        case "cancelar_cita":
          return {
            reply: `Para cancelar tu cita, escríbenos directamente o llámanos. Si necesitas reagendar, responde *4* y te ayudamos 🐾`,
            newState: "inicio",
          };
        case "fuera_de_scope":
          return {
            reply: `Hola 👋 Solo puedo ayudarte con citas y servicios de tu estética canina. ¿En qué te ayudo?\n\n1️⃣ Agendar una cita\n2️⃣ Ver precios\n4️⃣ Reagendar cita`,
            newState: "inicio",
          };
        // "menu" y casos no manejados: caen al flujo normal
      }
    }
  }

  switch (session.state) {
    case "inicio":
    case "finalizado":
      return handleInicio(text, config, tenantId, session.phone);

    case "seleccionar_servicio":
      return handleSeleccionarServicio(text, config);

    case "seleccionar_fecha":
      return handleSeleccionarFecha(text, config, tenantId, session);

    case "seleccionar_hora":
      return handleSeleccionarHora(text, config, tenantId, session);

    case "confirmar":
      return handleConfirmar(text, config, tenantId, session);

    case "esperando_confirmacion":
      return handleEsperandoConfirmacion(text, config, tenantId, session);

    case "reagendar_seleccionar":
      return handleReagendarSeleccionar(text, config, tenantId, session);

    case "reagendar_fecha":
      return handleReagendarFecha(text, config, tenantId, session);

    case "reagendar_hora":
      return handleReagendarHora(text, config, tenantId, session);

    default:
      return handleInicio(text, config, tenantId, session.phone);
  }
}