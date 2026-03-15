// lib/whatsapp-bot/handlers.ts
// Handlers para cada estado del bot conversacional

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { format, parse, addDays } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const MEXICO_TZ = "America/Mexico_City";
import { es } from "date-fns/locale";
import { getAvailableDates, getAvailableSlots } from "./availability";
import { extractRegistrationData } from "./ai-intent-router";
import type { BotConfig, WhatsappChatSession, ChatState } from "@/lib/supabase/types";

export interface HandlerResult {
  reply: string;
  newState: ChatState;
  updates?: Partial<WhatsappChatSession>;
}

// ============================================================
// Helper interno: verificar si un teléfono ya está registrado
// ============================================================
async function checkOwnerExists(phone: string, tenantId: string): Promise<boolean> {
  const db = getSupabaseAdmin() as any;
  const { data } = await db
    .from("owners")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("whatsapp", phone)
    .maybeSingle();
  return !!data;
}

// ============================================================
// Helper interno: crear owner + mascota y retomar intent original
// ============================================================
async function createOwnerAndPet(
  ownerName: string,
  petName: string,
  breed: string | null,
  size: string | null,
  phone: string,
  tenantId: string,
  config: BotConfig,
  pendingIntent: string
): Promise<HandlerResult> {
  const db = getSupabaseAdmin() as any;

  // Idempotencia: si ya existe, no crear duplicado
  const { data: existingOwner } = await db
    .from("owners")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("whatsapp", phone)
    .maybeSingle();

  let ownerId: string;

  if (existingOwner) {
    ownerId = existingOwner.id;
  } else {
    const { data: newOwner, error: ownerErr } = await db
      .from("owners")
      .insert({ tenant_id: tenantId, name: ownerName, whatsapp: phone })
      .select("id")
      .single();

    if (ownerErr || !newOwner) {
      console.error("[Onboarding] Error creando owner:", ownerErr?.message);
      return {
        reply: "😔 Hubo un problema al registrarte. Por favor contacta directamente a la estética.\n\nEscribe cualquier cosa para volver al menú.",
        newState: "inicio",
        updates: { selected_service: null, selected_date: null }
      };
    }

    ownerId = newOwner.id;

    // Crear mascota
    await db.from("pets").insert({
      tenant_id: tenantId,
      owner_id: ownerId,
      name: petName,
      breed: breed || null,
      species: "dog",
      temperament: "friendly",
      notes: size ? `Tamaño: ${size}` : null,
    });
  }

  const successMsg = `✅ ¡Listo ${ownerName}! *${petName}* ya está en nuestro sistema. 🐾\n\n`;

  if (pendingIntent === "agendar_cita") {
    const services = config.services || [];
    const serviceList = services
      .map((s, i) => `${i + 1}️⃣ ${s.label} — $${s.price}`)
      .join("\n");
    return {
      reply: successMsg + `Ahora dime, ¿qué servicio necesitas para ${petName}? 🐕\n\n${serviceList}\n\nEscribe el número del servicio`,
      newState: "seleccionar_servicio",
      updates: { selected_service: null, selected_date: null, owner_id: ownerId }
    };
  }

  return {
    reply: successMsg + config.welcome_message + "\n4️⃣ Reagendar cita",
    newState: "inicio",
    updates: { selected_service: null, selected_date: null, owner_id: ownerId }
  };
}

// ============================================================
// INICIO — Menú principal
// ============================================================
export async function handleInicio(input: string, config: BotConfig, tenantId: string, phone: string): Promise<HandlerResult> {
  const clean = input.trim();

  if (clean === "1") {
    // Verificar si el cliente ya está registrado
    const ownerExists = await checkOwnerExists(phone, tenantId);
    if (!ownerExists) {
      return {
        reply: "¡Hola! 🐾 Veo que es tu *primera vez* con nosotros. ¡Bienvenido!\n\n¿Cuál es tu nombre?",
        newState: "onboarding_nombre",
        updates: { selected_service: "pending:agendar_cita" }
      };
    }

    // Agendar cita → mostrar servicios
    const services = config.services || [];
    const serviceList = services
      .map((s, i) => `${i + 1}️⃣ ${s.label} — $${s.price}`)
      .join("\n");

    return {
      reply: `¿Qué servicio necesitas? 🐕\n\n${serviceList}\n\nEscribe el número del servicio`,
      newState: "seleccionar_servicio"
    };
  }

  if (clean === "2") {
    // Ver precios
    const services = config.services || [];
    const priceList = services
      .map(s => `🔹 ${s.label}: $${s.price} (${s.duration_min} min)`)
      .join("\n");

    const message = config.price_list_message
      ? config.price_list_message.replace("{lista_precios}", priceList)
      : `💰 Nuestros precios:\n\n${priceList}\n\nEscribe *1* para agendar una cita\nEscribe *0* para volver al menú`;

    return {
      reply: message,
      newState: "inicio"
    };
  }

  if (clean === "3") {
    return {
      reply: "📞 Un asesor se pondrá en contacto contigo pronto. ¡Gracias por tu paciencia!",
      newState: "finalizado"
    };
  }

  if (clean === "4") {
    // Reagendar — buscar citas activas del cliente
    return handleReagendarInicio(tenantId, phone, config);
  }

  // Cualquier otra entrada → mostrar menú de bienvenida con opción 4
  const welcomeWithReagendar = config.welcome_message + "\n4️⃣ Reagendar cita";
  return {
    reply: welcomeWithReagendar,
    newState: "inicio"
  };
}

// ============================================================
// SELECCIONAR SERVICIO
// ============================================================
export function handleSeleccionarServicio(
  input: string,
  config: BotConfig
): HandlerResult {
  const clean = input.trim();
  const index = parseInt(clean) - 1;
  const services = config.services || [];

  if (clean === "0") {
    return {
      reply: config.welcome_message + "\n4️⃣ Reagendar cita",
      newState: "inicio",
      updates: { selected_service: null }
    };
  }

  if (isNaN(index) || index < 0 || index >= services.length) {
    const serviceList = services
      .map((s, i) => `${i + 1}️⃣ ${s.label} — $${s.price}`)
      .join("\n");
    return {
      reply: `❌ Opción no válida. Elige un número:\n\n${serviceList}\n\nEscribe *0* para volver al menú`,
      newState: "seleccionar_servicio"
    };
  }

  const selected = services[index];

  // Mostrar fechas disponibles
  const dates = getAvailableDates(config, 5);
  if (dates.length === 0) {
    return {
      reply: "😔 No hay fechas disponibles en este momento. Por favor intenta más tarde.\n\nEscribe *0* para volver al menú",
      newState: "inicio"
    };
  }

  const dateList = dates
    .map((d, i) => `${i + 1}️⃣ ${d.label}`)
    .join("\n");

  return {
    reply: `✅ *${selected.label}* — $${selected.price}\n\n📅 ¿Qué día prefieres?\n\n${dateList}\n\nEscribe *0* para volver al menú`,
    newState: "seleccionar_fecha",
    updates: { selected_service: selected.key }
  };
}

// ============================================================
// SELECCIONAR FECHA
// ============================================================
export async function handleSeleccionarFecha(
  input: string,
  config: BotConfig,
  tenantId: string,
  session: WhatsappChatSession
): Promise<HandlerResult> {
  const clean = input.trim();

  if (clean === "0") {
    return {
      reply: config.welcome_message + "\n4️⃣ Reagendar cita",
      newState: "inicio",
      updates: { selected_service: null, selected_date: null }
    };
  }

  const dates = getAvailableDates(config, 5);
  const index = parseInt(clean) - 1;

  if (isNaN(index) || index < 0 || index >= dates.length) {
    const dateList = dates.map((d, i) => `${i + 1}️⃣ ${d.label}`).join("\n");
    return {
      reply: `❌ Opción no válida. Elige un día:\n\n${dateList}\n\nEscribe *0* para volver al menú`,
      newState: "seleccionar_fecha"
    };
  }

  const selectedDate = dates[index].date;

  // Encontrar la duración del servicio seleccionado
  const service = config.services.find(s => s.key === session.selected_service);
  const durationMin = service?.duration_min || config.slot_duration_min;

  // Consultar slots disponibles
  const slots = await getAvailableSlots(tenantId, selectedDate, durationMin, config);

  if (slots.length === 0) {
    return {
      reply: `😔 No hay horarios disponibles para ${dates[index].label}. Elige otra fecha:\n\n${dates.map((d, i) => `${i + 1}️⃣ ${d.label}`).join("\n")}`,
      newState: "seleccionar_fecha"
    };
  }

  const slotList = slots
    .map((s, i) => `${i + 1}️⃣ ${s.label}`)
    .join("\n");

  return {
    reply: `📅 *${dates[index].label}*\n\n🕐 Horarios disponibles:\n\n${slotList}\n\nEscribe *0* para volver al menú`,
    newState: "seleccionar_hora",
    updates: { selected_date: format(selectedDate, "yyyy-MM-dd") }
  };
}

// ============================================================
// SELECCIONAR HORA
// ============================================================
export async function handleSeleccionarHora(
  input: string,
  config: BotConfig,
  tenantId: string,
  session: WhatsappChatSession
): Promise<HandlerResult> {
  const clean = input.trim();

  if (clean === "0") {
    return {
      reply: config.welcome_message + "\n4️⃣ Reagendar cita",
      newState: "inicio",
      updates: { selected_service: null, selected_date: null, selected_time: null }
    };
  }

  // Re-obtener los slots para validar la selección
  const selectedDate = session.selected_date ? new Date(session.selected_date + "T12:00:00") : new Date();
  const service = config.services.find(s => s.key === session.selected_service);
  const durationMin = service?.duration_min || config.slot_duration_min;

  const slots = await getAvailableSlots(tenantId, selectedDate, durationMin, config);
  const index = parseInt(clean) - 1;

  if (isNaN(index) || index < 0 || index >= slots.length) {
    const slotList = slots.map((s, i) => `${i + 1}️⃣ ${s.label}`).join("\n");
    return {
      reply: `❌ Opción no válida. Elige un horario:\n\n${slotList}\n\nEscribe *0* para volver al menú`,
      newState: "seleccionar_hora"
    };
  }

  const selectedSlot = slots[index];
  const dateLabel = format(selectedDate, "EEE d 'de' MMM", { locale: es });

  return {
    reply: `📋 *Confirma tu cita:*\n\n🐕 Servicio: *${service?.label || session.selected_service}*\n📅 Fecha: *${dateLabel}*\n🕐 Hora: *${selectedSlot.label}*\n💰 Precio: *$${service?.price || ""}*\n\n1️⃣ ✅ Confirmar\n2️⃣ ❌ Cancelar`,
    newState: "confirmar",
    updates: { selected_time: selectedSlot.time }
  };
}

// ============================================================
// CONFIRMAR — Crear la cita
// ============================================================
export async function handleConfirmar(
  input: string,
  config: BotConfig,
  tenantId: string,
  session: WhatsappChatSession
): Promise<HandlerResult> {
  const clean = input.trim();

  if (clean === "2" || clean === "0") {
    return {
      reply: "❌ Cita cancelada.\n\n" + config.welcome_message + "\n4️⃣ Reagendar cita",
      newState: "inicio",
      updates: {
        selected_service: null,
        selected_date: null,
        selected_time: null
      }
    };
  }

  if (clean !== "1") {
    return {
      reply: "Escribe *1* para confirmar o *2* para cancelar",
      newState: "confirmar"
    };
  }

  // Crear la cita
  try {
    const service = config.services.find(s => s.key === session.selected_service);

    // Construir el datetime de la cita
    const supabaseAdmin2 = getSupabaseAdmin();
    const { data: freshData } = await supabaseAdmin2
      .from("whatsapp_chat_sessions")
      .select("selected_date, selected_time, selected_service")
      .eq("id", session.id)
      .single();

    const selected_date = freshData?.selected_date || session.selected_date;
    const selected_time = (freshData?.selected_time || session.selected_time || "").toString().slice(0, 5);

    if (!selected_date || !selected_time) {
      return {
        reply: "⚠️ Hubo un problema con tu sesión. Por favor vuelve a agendar desde el inicio.",
        newState: "inicio",
        updates: { selected_service: null, selected_date: null, selected_time: null }
      };
    }

    const scheduledAt = fromZonedTime(`${selected_date}T${selected_time}:00`, MEXICO_TZ);

    // Buscar si el teléfono pertenece a un owner existente
    const supabaseAdmin = getSupabaseAdmin();
    const { data: owner } = await supabaseAdmin
      .from("owners")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("whatsapp", session.phone)
      .returns<any>()
      .single();

    if (!owner || !(owner as any).id) {
      return {
        reply: "⚠️ Tu número no está registrado en nuestro sistema.\n\n📞 Por favor contacta directamente a la estética para registrarte y agendar tu primera cita.\n\nEscribe cualquier cosa para volver al menú.",
        newState: "inicio",
        updates: {
          selected_service: null,
          selected_date: null,
          selected_time: null
        }
      };
    }

    // Buscar la primera mascota del owner
    const { data: pets } = await supabaseAdmin
      .from("pets")
      .select("id, name")
      .eq("owner_id", owner.id)
      .eq("tenant_id", tenantId)
      .returns<any[]>()
      .limit(1);

    const pet = pets?.[0];
    if (!pet) {
      return {
        reply: "⚠️ No encontramos mascotas registradas a tu nombre.\n\n📞 Contacta a la estética para registrar a tu mascota.\n\nEscribe cualquier cosa para volver al menú.",
        newState: "inicio",
        updates: {
          selected_service: null,
          selected_date: null,
          selected_time: null
        }
      };
    }

    // Mapear service key a appointment_type
    const typeMap: Record<string, string> = {
      bath: "bath",
      haircut: "haircut",
      bath_haircut: "bath_haircut",
      vaccine: "vaccine",
      checkup: "checkup"
    };
    const apptType = typeMap[session.selected_service || ""] || "other";

    // Insertar la cita
    const { data: newAppt, error: apptErr } = await supabaseAdmin
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        pet_id: (pet as any).id,
        owner_id: (owner as any).id,
        type: apptType,
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
        duration_min: service?.duration_min || 60,
        price: service?.price || null,
        notes: "Agendado por Bot WhatsApp"
      } as any)
      .select()
      .returns<any>()
      .single();

    if (apptErr) {
      console.error("[Bot] Error creating appointment:", apptErr);
      return {
        reply: "😔 Hubo un error al agendar tu cita. Por favor intenta de nuevo.\n\nEscribe cualquier cosa para volver al menú.",
        newState: "inicio",
        updates: {
          selected_service: null,
          selected_date: null,
          selected_time: null
        }
      };
    }

    // Formatear mensaje de confirmación (mostrar en hora México)
    const apptMexicoTime = toZonedTime(scheduledAt, MEXICO_TZ);
    const dateLabel = format(apptMexicoTime, "EEEE d 'de' MMMM", { locale: es });
    const timeLabel = format(apptMexicoTime, "h:mm a");
    const confirmation = config.confirmation_template
      .replace("{servicio}", service?.label || session.selected_service || "")
      .replace("{fecha}", dateLabel)
      .replace("{hora}", timeLabel);

    return {
      reply: confirmation,
      newState: "finalizado",
      updates: {
        selected_service: null,
        selected_date: null,
        selected_time: null
      }
    };

  } catch (err: any) {
    console.error("[Bot] Unexpected error in handleConfirmar:", err);
    return {
      reply: "😔 Ocurrió un error inesperado. Por favor intenta de nuevo.\n\n" + config.welcome_message,
      newState: "inicio",
      updates: {
        selected_service: null,
        selected_date: null,
        selected_time: null
      }
    };
  }
}

// ============================================================
// ESPERANDO CONFIRMACIÓN — Respuesta a recordatorio 24h
// ============================================================
export async function handleEsperandoConfirmacion(
  input: string,
  config: BotConfig,
  tenantId: string,
  session: WhatsappChatSession
): Promise<HandlerResult> {
  const clean = input.trim();

  if (clean === "1") {
    // Confirmar asistencia
    if (session.selected_service) {
      // selected_service stores the appointment ID in this context
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from("appointments")
        .update({ status: "confirmed" } as any)
        .eq("id", session.selected_service)
        .eq("tenant_id", tenantId);
    }
    return {
      reply: "✅ ¡Perfecto! Tu asistencia ha sido confirmada. ¡Te esperamos! 🐕",
      newState: "finalizado",
      updates: { selected_service: null }
    };
  }

  if (clean === "2") {
    // Cancelar cita
    if (session.selected_service) {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from("appointments")
        .update({ status: "cancelled" } as any)
        .eq("id", session.selected_service)
        .eq("tenant_id", tenantId);
    }
    return {
      reply: "❌ Cita cancelada. Esperamos verte pronto.\n\n¿Deseas agendar otra cita?\n\n1️⃣ Sí, agendar nueva cita\n0️⃣ No, gracias",
      newState: "inicio",
      updates: { selected_service: null }
    };
  }

  if (clean === "3") {
    // Reagendar — cancelar la actual e iniciar el flujo de agendar
    if (session.selected_service) {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from("appointments")
        .update({ status: "cancelled" } as any)
        .eq("id", session.selected_service)
        .eq("tenant_id", tenantId);
    }

    const services = config.services || [];
    const serviceList = services
      .map((s, i) => `${i + 1}️⃣ ${s.label} — $${s.price}`)
      .join("\n");

    return {
      reply: `🔄 Cita cancelada. Vamos a reagendar.\n\n¿Qué servicio necesitas? 🐕\n\n${serviceList}`,
      newState: "seleccionar_servicio",
      updates: { selected_service: null }
    };
  }

  return {
    reply: "Por favor elige una opción:\n\n1️⃣ ✅ Confirmar asistencia\n2️⃣ ❌ Cancelar cita\n3️⃣ 🔄 Reagendar",
    newState: "esperando_confirmacion"
  };
}

// ============================================================
// REAGENDAR — Mostrar citas activas del cliente
// ============================================================
async function handleReagendarInicio(
  tenantId: string,
  phone: string,
  config: BotConfig
): Promise<HandlerResult> {
  const supabaseAdmin = getSupabaseAdmin();
  // Buscar owner por teléfono
  const { data: owner } = await supabaseAdmin
    .from("owners")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("whatsapp", phone)
    .returns<any>()
    .single();

  if (!owner) {
    return {
      reply: "⚠️ No encontramos citas asociadas a tu número.\n\nEscribe cualquier cosa para volver al menú.",
      newState: "inicio"
    };
  }

  // Buscar citas futuras del owner
  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, type, status, pets(name)")
    .eq("owner_id", owner.id)
    .eq("tenant_id", tenantId)
    .in("status", ["scheduled", "confirmed"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .returns<any[]>()
    .limit(5);

  if (!appointments || appointments.length === 0) {
    return {
      reply: "📅 No tienes citas próximas programadas.\n\n¿Deseas agendar una nueva?\n\n1️⃣ Sí, agendar cita\n0️⃣ Volver al menú",
      newState: "inicio"
    };
  }

  const typeLabels: Record<string, string> = {
    bath: "Baño", haircut: "Corte", bath_haircut: "Baño + Corte",
    vaccine: "Vacuna", checkup: "Chequeo", other: "Otro"
  };

  const apptList = appointments.map((a: any, i: number) => {
    const date = format(new Date(a.scheduled_at), "EEE d MMM h:mm a", { locale: es });
    const petName = a.pets?.name || "Mascota";
    const typeName = typeLabels[a.type] || a.type;
    return `${i + 1}️⃣ ${petName} — ${typeName}\n   📅 ${date}`;
  }).join("\n\n");

  return {
    reply: `🔄 *Tus citas próximas:*\n\n${apptList}\n\n¿Cuál deseas reagendar? Escribe el número.\n\nEscribe *0* para volver al menú`,
    newState: "reagendar_seleccionar"
  };
}

export async function handleReagendarSeleccionar(
  input: string,
  config: BotConfig,
  tenantId: string,
  session: WhatsappChatSession
): Promise<HandlerResult> {
  const clean = input.trim();

  if (clean === "0") {
    return {
      reply: config.welcome_message + "\n4️⃣ Reagendar cita",
      newState: "inicio"
    };
  }

  const supabaseAdmin = getSupabaseAdmin();
  // Re-consultar las citas del owner
  const { data: owner } = await supabaseAdmin
    .from("owners")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("whatsapp", session.phone)
    .returns<any>()
    .maybeSingle();

  if (!owner) {
    return {
      reply: "⚠️ Error buscando tus citas. Escribe cualquier cosa para volver al menú.",
      newState: "inicio"
    };
  }

  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, type, duration_min")
    .eq("owner_id", owner.id)
    .eq("tenant_id", tenantId)
    .in("status", ["scheduled", "confirmed"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .returns<any[]>()
    .limit(5);

  const index = parseInt(clean) - 1;
  if (!appointments || isNaN(index) || index < 0 || index >= appointments.length) {
    return {
      reply: "❌ Opción no válida. Escribe el número de la cita que deseas reagendar, o *0* para volver.",
      newState: "reagendar_seleccionar"
    };
  }

  const selected = appointments[index];

  // Mostrar fechas disponibles para reagendar
  const dates = getAvailableDates(config, 5);
  const dateList = dates.map((d, i) => `${i + 1}️⃣ ${d.label}`).join("\n");

  // Guardar el ID de la cita a reagendar en selected_service (reutilizamos el campo)
  return {
    reply: `🔄 Reagendando tu cita...\n\n📅 ¿A qué día quieres moverla?\n\n${dateList}\n\nEscribe *0* para cancelar`,
    newState: "reagendar_fecha",
    updates: {
      selected_service: selected.id, // Store appointment ID
      selected_date: null,
      selected_time: null
    }
  };
}

export async function handleReagendarFecha(
  input: string,
  config: BotConfig,
  tenantId: string,
  session: WhatsappChatSession
): Promise<HandlerResult> {
  const clean = input.trim();

  if (clean === "0") {
    return {
      reply: config.welcome_message + "\n4️⃣ Reagendar cita",
      newState: "inicio",
      updates: { selected_service: null }
    };
  }

  const dates = getAvailableDates(config, 5);
  const index = parseInt(clean) - 1;

  if (isNaN(index) || index < 0 || index >= dates.length) {
    const dateList = dates.map((d, i) => `${i + 1}️⃣ ${d.label}`).join("\n");
    return {
      reply: `❌ Opción no válida.\n\n${dateList}\n\nEscribe *0* para cancelar`,
      newState: "reagendar_fecha"
    };
  }

  const selectedDate = dates[index].date;

  const supabaseAdmin = getSupabaseAdmin();
  // Get original appointment to know the duration
  const { data: origAppt } = await supabaseAdmin
    .from("appointments")
    .select("duration_min, type")
    .eq("id", session.selected_service)
    .returns<any>()
    .single();

  const durationMin = (origAppt as any)?.duration_min || config.slot_duration_min;
  const slots = await getAvailableSlots(tenantId, selectedDate, durationMin, config);

  if (slots.length === 0) {
    const dateList = dates.map((d, i) => `${i + 1}️⃣ ${d.label}`).join("\n");
    return {
      reply: `😔 No hay horarios disponibles ese día. Elige otro:\n\n${dateList}`,
      newState: "reagendar_fecha"
    };
  }

  const slotList = slots.map((s, i) => `${i + 1}️⃣ ${s.label}`).join("\n");

  return {
    reply: `📅 *${dates[index].label}*\n\n🕐 Horarios disponibles:\n\n${slotList}\n\nEscribe *0* para cancelar`,
    newState: "reagendar_hora",
    updates: { selected_date: format(selectedDate, "yyyy-MM-dd") }
  };
}

// ============================================================
// ONBOARDING — Nuevo cliente: pedir nombre
// ============================================================
export async function handleOnboardingNombre(
  input: string,
  config: BotConfig,
  _tenantId: string,
  session: WhatsappChatSession
): Promise<HandlerResult> {
  const extracted = await extractRegistrationData(input, "nombre");

  if (!extracted?.owner_name) {
    return {
      reply: "No pude entender tu nombre 😅\n\n¿Puedes escribirlo? Ejemplo: *Juan Pérez*",
      newState: "onboarding_nombre"
    };
  }

  const ownerName = extracted.owner_name;
  const pendingIntent = (session.selected_service ?? "pending:agendar_cita").replace("pending:", "");

  // Si también proporcionó datos de la mascota, registrar todo de una vez
  if (extracted.pet_name) {
    return createOwnerAndPet(
      ownerName,
      extracted.pet_name,
      extracted.breed,
      extracted.size,
      session.phone,
      session.tenant_id,
      config,
      pendingIntent
    );
  }

  // Solo obtuvimos el nombre → pedir datos de la mascota
  return {
    reply: `¡Perfecto, ${ownerName}! 🐕\n\n¿Cómo se llama tu mascota? Cuéntame su nombre, raza y tamaño (pequeño, mediano o grande).\n\nEjemplo: *Toby, Labrador, grande*`,
    newState: "onboarding_mascota",
    updates: { selected_date: ownerName } // Temp: nombre del dueño en selected_date
  };
}

// ============================================================
// ONBOARDING — Nuevo cliente: pedir datos de mascota
// ============================================================
export async function handleOnboardingMascota(
  input: string,
  config: BotConfig,
  _tenantId: string,
  session: WhatsappChatSession
): Promise<HandlerResult> {
  const ownerName = session.selected_date; // Recuperado del almacenamiento temporal

  if (!ownerName) {
    return {
      reply: "Ocurrió un error en el registro 😔 ¿Puedes escribir tu nombre nuevamente?",
      newState: "onboarding_nombre",
      updates: { selected_date: null }
    };
  }

  const extracted = await extractRegistrationData(input, "mascota", ownerName);

  if (!extracted?.pet_name) {
    return {
      reply: `No pude entender los datos de tu mascota 😅\n\n¿Puedes escribirlos así?\n\nEjemplo: *Toby, Pug, pequeño*`,
      newState: "onboarding_mascota"
    };
  }

  const pendingIntent = (session.selected_service ?? "pending:agendar_cita").replace("pending:", "");

  return createOwnerAndPet(
    ownerName,
    extracted.pet_name,
    extracted.breed,
    extracted.size,
    session.phone,
    session.tenant_id,
    config,
    pendingIntent
  );
}

export async function handleReagendarHora(
  input: string,
  config: BotConfig,
  tenantId: string,
  session: WhatsappChatSession
): Promise<HandlerResult> {
  const clean = input.trim();

  if (clean === "0") {
    return {
      reply: config.welcome_message + "\n4️⃣ Reagendar cita",
      newState: "inicio",
      updates: { selected_service: null, selected_date: null }
    };
  }

  const selectedDate = session.selected_date ? new Date(session.selected_date + "T12:00:00") : new Date();

  const supabaseAdmin = getSupabaseAdmin();
  const { data: origAppt } = await supabaseAdmin
    .from("appointments")
    .select("duration_min")
    .eq("id", session.selected_service)
    .returns<any>()
    .single();

  const durationMin = (origAppt as any)?.duration_min || config.slot_duration_min;
  const slots = await getAvailableSlots(tenantId, selectedDate, durationMin, config);
  const index = parseInt(clean) - 1;

  if (isNaN(index) || index < 0 || index >= slots.length) {
    const slotList = slots.map((s, i) => `${i + 1}️⃣ ${s.label}`).join("\n");
    return {
      reply: `❌ Opción no válida.\n\n${slotList}\n\nEscribe *0* para cancelar`,
      newState: "reagendar_hora"
    };
  }

  const selectedSlot = slots[index];
  const newScheduledAt = fromZonedTime(`${session.selected_date}T${selectedSlot.time}:00`, MEXICO_TZ);
  // Actualizar la cita existente
  const { error: updateErr } = await supabaseAdmin
    .from("appointments")
    .update({
      scheduled_at: newScheduledAt.toISOString(),
      status: "scheduled",
      reminder_sent: false, // Reset reminder for new date
      notes: "Reagendado por Bot WhatsApp"
    } as any)
    .eq("id", session.selected_service)
    .eq("tenant_id", tenantId);

  if (updateErr) {
    console.error("[Bot] Error rescheduling:", updateErr);
    return {
      reply: "😔 Hubo un error al reagendar. Intenta de nuevo.\n\n" + config.welcome_message,
      newState: "inicio",
      updates: { selected_service: null, selected_date: null }
    };
  }

  const reagendaMexicoTime = toZonedTime(newScheduledAt, MEXICO_TZ);
  const dateLabel = format(reagendaMexicoTime, "EEEE d 'de' MMMM", { locale: es });
  const timeLabel = format(reagendaMexicoTime, "h:mm a");

  return {
    reply: `✅ ¡Cita reagendada exitosamente!\n\n📅 Nueva fecha: *${dateLabel}*\n🕐 Nueva hora: *${timeLabel}*\n\n¡Te esperamos! 🐕`,
    newState: "finalizado",
    updates: {
      selected_service: null,
      selected_date: null,
      selected_time: null
    }
  };
}
