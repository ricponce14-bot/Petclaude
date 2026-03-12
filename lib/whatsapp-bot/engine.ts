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
  if (!config || !config.is_enabled) {
    return null; // Bot desactivado → no responder
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
  await updateSession(session.id, {
    state: result.newState,
    last_message_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // renovar TTL
    ...result.updates
  });

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
  let session = await getOrCreateSession(phone, tenantId);

  await updateSession(session.id, {
    state: "esperando_confirmacion" as ChatState,
    selected_service: appointmentId, // reutilizamos el campo para guardar el appointment ID
    last_message_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h TTL para confirmaciones
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

  if (error || !data) return null;

  // Parsear JSONB si viene como string
  const config = data as any;
  return {
    ...config,
    services: typeof config.services === "string" ? JSON.parse(config.services) : config.services,
    business_hours: typeof config.business_hours === "string" ? JSON.parse(config.business_hours) : config.business_hours,
  } as BotConfig;
}

async function getOrCreateSession(
  phone: string,
  tenantId: string
): Promise<WhatsappChatSession> {
  const supabaseAdmin = getSupabaseAdmin();
  // Buscar sesión activa existente
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

  // Crear nueva sesión
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
  tenantId: string,
  phone: string
): Promise<WhatsappChatSession> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("whatsapp_chat_sessions")
    .update({
      state: "inicio",
      selected_service: null,
      selected_date: null,
      selected_time: null,
      selected_pet_id: null,
      last_message_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    } as any)
    .eq("id", sessionId)
    .select()
    .returns<any>()
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
  await supabaseAdmin
    .from("whatsapp_chat_sessions")
    .update(updates as any)
    .eq("id", sessionId);
}

async function routeToHandler(
  session: WhatsappChatSession,
  text: string,
  config: BotConfig,
  tenantId: string
): Promise<HandlerResult> {
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

