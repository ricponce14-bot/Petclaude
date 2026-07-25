// app/api/cron/reminders-24h/route.ts
// Recordatorio 24h antes de cada cita, vía plantilla oficial de la Cloud API
// (fuera de la ventana de 24h SOLO se puede iniciar conversación con plantilla
// aprobada — doc secciones 8 y 9). Cuando el cliente responde, se abre la
// ventana y el bot maneja la confirmación (estado esperando_confirmacion).
// Se ejecuta cada hora vía Vercel Cron. Protegido con CRON_SECRET.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { startReminderConfirmation } from "@/lib/whatsapp-bot/engine";
import { sendRecordatorio } from "@/lib/whatsapp/templates";
import { toZonedTime, format } from "date-fns-tz";
import { es } from "date-fns/locale";

const MEXICO_TZ = "America/Mexico_City";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return runReminders(req);
}

export async function POST(req: Request) {
  return runReminders(req);
}

async function runReminders(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Ventana amplia: 22h–26h para no perder citas si el cron corre con desfase.
    const now = new Date();
    const windowStart = new Date(now.getTime() + 22 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("*, owner:owners(*), pet:pets(*), tenant:tenants(name)")
      .in("status", ["scheduled", "confirmed"])
      .eq("reminder_sent", false)
      .gte("scheduled_at", windowStart.toISOString())
      .lte("scheduled_at", windowEnd.toISOString())
      .returns<any[]>();

    if (error) {
      console.error("[reminders-24h] Error consultando citas:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "Sin citas para recordar" });
    }

    let sent = 0;
    let failed = 0;

    for (const appt of appointments) {
      try {
        // Teléfono: cliente clásico (owners) o cita genérica creada por Mía.
        const rawPhone: string | null =
          appt.owner?.whatsapp || appt.owner?.phone || appt.cliente_telefono || null;
        if (!rawPhone) {
          console.warn(`[reminders-24h] Cita ${appt.id}: sin teléfono del cliente`);
          continue;
        }
        const phone = rawPhone.replace(/\D/g, "");

        const apptMx = toZonedTime(new Date(appt.scheduled_at), MEXICO_TZ);
        const fechaStr = format(apptMx, "EEEE d 'de' MMMM", { locale: es });
        const horaStr = format(apptMx, "h:mm a");
        const cliente: string = appt.owner?.name || appt.cliente_nombre || "cliente";
        const negocio: string = appt.tenant?.name || "tu negocio";

        // Enviar plantilla `recordatorio_cita` (aprobada en Meta).
        const result = await sendRecordatorio(phone, {
          cliente,
          negocio,
          fecha: fechaStr,
          hora: horaStr,
        });

        // Loguear el envío en wa_messages (historial / outbox).
        await supabaseAdmin.from("wa_messages").insert({
          tenant_id: appt.tenant_id,
          owner_id: appt.owner_id ?? null,
          pet_id: appt.pet_id ?? null,
          appt_id: appt.id,
          type: "reminder",
          phone,
          body: `Recordatorio de cita — ${fechaStr} ${horaStr} (plantilla)`,
          status: result.ok ? "sent" : "failed",
          direction: "outbound",
          sent_at: new Date().toISOString(),
          error: result.ok ? null : result.error ?? "template send failed",
        } as any);

        if (!result.ok) {
          failed++;
          continue; // no marcar reminder_sent: reintenta en la próxima corrida
        }

        // Dejar la sesión lista para procesar la respuesta (SÍ / reagendar).
        await startReminderConfirmation(phone, appt.tenant_id, appt.id);

        await supabaseAdmin
          .from("appointments")
          .update({ reminder_sent: true } as any)
          .eq("id", appt.id);

        sent++;
      } catch (err: any) {
        console.error(`[reminders-24h] Error procesando cita ${appt.id}:`, err.message);
        failed++;
      }
    }

    console.log(`[reminders-24h] Completado: ${sent} enviados, ${failed} fallidos`);
    return NextResponse.json({ ok: true, sent, failed });
  } catch (err: any) {
    console.error("[reminders-24h] Error inesperado:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
