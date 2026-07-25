// lib/mia/actions.ts
// Implementación de las herramientas de Mía contra el backend real (Supabase).
// Doc sección 7. Cada función recibe el tenantId (estetica_id) del dueño.

import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MEXICO_TZ = "America/Mexico_City";

function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: MEXICO_TZ,
  });
}

/** Combina día (YYYY-MM-DD) + hora (HH:MM) en un timestamptz. Default 09:00. */
function toTimestamp(dia: string, hora?: string): string {
  const time = hora && /^\d{1,2}:\d{2}$/.test(hora) ? hora : "09:00";
  // Interpretado como hora local de México; se guarda en UTC por Postgres.
  return new Date(`${dia}T${time}:00`).toISOString();
}

export async function crearCita(
  tenantId: string,
  input: { cliente: string; cliente_telefono?: string; dia: string; hora?: string; servicio?: string }
): Promise<string> {
  const db = getSupabaseAdmin() as any;
  const scheduledAt = toTimestamp(input.dia, input.hora);
  const { error } = await db.from("appointments").insert({
    tenant_id: tenantId,
    cliente_nombre: input.cliente,
    cliente_telefono: input.cliente_telefono ?? null,
    servicio: input.servicio ?? null,
    type: "other",
    status: "scheduled",
    scheduled_at: scheduledAt,
  });
  if (error) return `No pude agendar la cita: ${error.message}`;
  const cuando = new Date(scheduledAt).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: MEXICO_TZ,
  });
  return `Cita agendada para ${input.cliente} el ${cuando}${input.servicio ? ` (${input.servicio})` : ""}.`;
}

export async function consultarDisponibilidad(
  tenantId: string,
  input: { dia: string }
): Promise<string> {
  const db = getSupabaseAdmin() as any;
  const start = new Date(`${input.dia}T00:00:00`).toISOString();
  const end = new Date(`${input.dia}T23:59:59`).toISOString();
  const { data, error } = await db
    .from("appointments")
    .select("scheduled_at, cliente_nombre, servicio")
    .eq("tenant_id", tenantId)
    .in("status", ["scheduled", "confirmed"])
    .gte("scheduled_at", start)
    .lte("scheduled_at", end)
    .order("scheduled_at", { ascending: true });
  if (error) return `No pude consultar la disponibilidad: ${error.message}`;
  if (!data || data.length === 0) return `El ${input.dia} no tiene citas: día completamente libre.`;
  const ocupados = data.map((c: any) => fmtHora(c.scheduled_at)).join(", ");
  return `El ${input.dia} hay ${data.length} cita(s). Horarios ocupados: ${ocupados}.`;
}

export async function registrarGasto(
  tenantId: string,
  input: { monto: number; concepto?: string; fecha?: string },
  registradoPor: string
): Promise<string> {
  const db = getSupabaseAdmin() as any;
  const { error } = await db.from("expenses").insert({
    tenant_id: tenantId,
    monto: input.monto,
    concepto: input.concepto ?? null,
    fecha: input.fecha ?? undefined, // default current_date en la BD
    registrado_por: registradoPor,
  });
  if (error) return `No pude registrar el gasto: ${error.message}`;
  return `Gasto registrado: $${input.monto} MXN${input.concepto ? ` — ${input.concepto}` : ""}.`;
}

export async function consultarAgendaHoy(tenantId: string): Promise<string> {
  const db = getSupabaseAdmin() as any;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  const { data, error } = await db
    .from("appointments")
    .select("scheduled_at, cliente_nombre, servicio, status")
    .eq("tenant_id", tenantId)
    .in("status", ["scheduled", "confirmed"])
    .gte("scheduled_at", start)
    .lte("scheduled_at", end)
    .order("scheduled_at", { ascending: true });
  if (error) return `No pude consultar la agenda: ${error.message}`;
  if (!data || data.length === 0) return "Hoy no tienes citas agendadas.";
  const lineas = data
    .map((c: any) => `• ${fmtHora(c.scheduled_at)} — ${c.cliente_nombre ?? "Cliente"}${c.servicio ? ` (${c.servicio})` : ""}`)
    .join("\n");
  return `Tienes ${data.length} cita(s) hoy:\n${lineas}`;
}

export async function consultarGastos(
  tenantId: string,
  input: { desde?: string; hasta?: string }
): Promise<string> {
  const db = getSupabaseAdmin() as any;
  const hoy = new Date().toISOString().slice(0, 10);
  const desde = input.desde ?? hoy;
  const hasta = input.hasta ?? desde;
  const { data, error } = await db
    .from("expenses")
    .select("monto, concepto, fecha")
    .eq("tenant_id", tenantId)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true });
  if (error) return `No pude consultar los gastos: ${error.message}`;
  if (!data || data.length === 0) return `No hay gastos registrados entre ${desde} y ${hasta}.`;
  const total = data.reduce((s: number, g: any) => s + Number(g.monto), 0);
  const lineas = data
    .map((g: any) => `• ${g.fecha}: $${g.monto}${g.concepto ? ` — ${g.concepto}` : ""}`)
    .join("\n");
  return `Gastos entre ${desde} y ${hasta} (total $${total} MXN):\n${lineas}`;
}
