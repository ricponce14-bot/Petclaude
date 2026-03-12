// lib/whatsapp-bot/availability.ts
// Módulo para consultar disponibilidad de horarios

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { format, addDays, startOfDay, endOfDay, parse, addMinutes, isBefore, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import type { BotConfig, BotBusinessHours, BotDayHours } from "@/lib/supabase/types";

const DAY_KEYS: Record<number, string> = {
  0: "dom", 1: "lun", 2: "mar", 3: "mie", 4: "jue", 5: "vie", 6: "sab"
};

/**
 * Retorna los próximos días laborables disponibles según el config del negocio
 */
export function getAvailableDates(config: BotConfig, maxDays = 5): { date: Date; label: string }[] {
  const results: { date: Date; label: string }[] = [];
  let current = new Date();

  // Buscar hasta 14 días hacia adelante para encontrar 'maxDays' disponibles
  for (let i = 0; i < 14 && results.length < maxDays; i++) {
    const day = addDays(current, i);
    const dayKey = DAY_KEYS[day.getDay()];
    const hours = config.business_hours[dayKey];

    if (hours) {
      const label = i === 0
        ? `Hoy (${format(day, "EEE d MMM", { locale: es })})`
        : i === 1
          ? `Mañana (${format(day, "EEE d MMM", { locale: es })})`
          : format(day, "EEE d MMM", { locale: es });

      results.push({ date: day, label });
    }
  }

  return results;
}

/**
 * Retorna los slots de horario disponibles para un día y duración dados
 */
export async function getAvailableSlots(
  tenantId: string,
  date: Date,
  durationMin: number,
  config: BotConfig
): Promise<{ time: string; label: string }[]> {
  const supabaseAdmin = getSupabaseAdmin();
  const dayKey = DAY_KEYS[date.getDay()];
  const hours = config.business_hours[dayKey] as BotDayHours | null;

  if (!hours) return [];

  // Obtener citas existentes para ese día
  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();

  const { data: existingAppts } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, duration_min")
    .eq("tenant_id", tenantId)
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .in("status", ["scheduled", "confirmed"])
    .returns<any[]>();

  // Parsear horarios ocupados
  const busySlots = (existingAppts || []).map(a => ({
    start: new Date(a.scheduled_at),
    end: addMinutes(new Date(a.scheduled_at), a.duration_min || 60)
  }));

  // Generar todos los slots posibles del día
  const openTime = parse(hours.open, "HH:mm", date);
  const closeTime = parse(hours.close, "HH:mm", date);
  const slotDuration = durationMin || config.slot_duration_min;

  const slots: { time: string; label: string }[] = [];
  let cursor = openTime;

  while (isBefore(addMinutes(cursor, slotDuration), closeTime) || 
         addMinutes(cursor, slotDuration).getTime() === closeTime.getTime()) {
    const slotEnd = addMinutes(cursor, slotDuration);

    // Verificar que no se traslape con citas existentes
    const isAvailable = !busySlots.some(busy =>
      (isBefore(cursor, busy.end) && isAfter(slotEnd, busy.start))
    );

    // Si es hoy, solo mostrar slots futuros (al menos 1 hora desde ahora)
    const now = new Date();
    const isInFuture = isAfter(cursor, addMinutes(now, 60)) || !isSameDay(date, now);

    if (isAvailable && isInFuture) {
      slots.push({
        time: format(cursor, "HH:mm"),
        label: format(cursor, "h:mm a")
      });
    }

    cursor = addMinutes(cursor, slotDuration);
  }

  return slots;
}

// Helper simple para verificar si dos fechas son el mismo día
function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}
