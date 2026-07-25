// app/api/cron/reminders-1h/route.ts
// "Ya casi es tu cita" 1 hora antes, solo para citas CONFIRMADAS.
// Como el cliente confirmó (respondió al recordatorio de 24h), la ventana de
// 24h suele estar abierta → intentamos texto libre por Cloud API; si Meta lo
// rechaza (ventana cerrada), caemos a la plantilla de recordatorio.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendText } from "@/lib/whatsapp/cloud-client";
import { sendRecordatorio } from "@/lib/whatsapp/templates";
import { toZonedTime, format } from "date-fns-tz";
import { es } from "date-fns/locale";

const MEXICO_TZ = "America/Mexico_City";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return runReminders1h(req);
}

export async function POST(req: Request) {
  return runReminders1h(req);
}

async function runReminders1h(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Ventana: citas entre 50 y 70 min desde ahora.
    const now = new Date();
    const windowStart = new Date(now.getTime() + 50 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 70 * 60 * 1000);

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("*, owner:owners(*), pet:pets(*), tenant:tenants(name)")
      .eq("status", "confirmed")
      .gte("scheduled_at", windowStart.toISOString())
      .lte("scheduled_at", windowEnd.toISOString())
      .returns<any[]>();

    if (error) {
      console.error("[reminders-1h] Error consultando citas:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "Sin citas próximas" });
    }

    let sent = 0;
    let failed = 0;

    for (const appt of appointments) {
      try {
        const rawPhone: string | null =
          appt.owner?.whatsapp || appt.owner?.phone || appt.cliente_telefono || null;
        if (!rawPhone) continue;
        const phone = rawPhone.replace(/\D/g, "");

        const apptMx = toZonedTime(new Date(appt.scheduled_at), MEXICO_TZ);
        const horaStr = format(apptMx, "h:mm a");
        const fechaStr = format(apptMx, "EEEE d 'de' MMMM", { locale: es });
        const cliente: string = appt.owner?.name || appt.cliente_nombre || "";
        const negocio: string = appt.tenant?.name || "tu negocio";
        const quien: string = appt.pet?.name ? `la cita de *${appt.pet.name}*` : "tu cita";

        const body =
          `⏰ *¡Tu cita es en 1 hora!*\n\n` +
          `Hola ${cliente}! En menos de una hora es ${quien} a las *${horaStr}*.\n\n` +
          `¡Te esperamos! 🐾`;

        // 1er intento: texto libre (ventana de 24h abierta tras la confirmación).
        let result = await sendText(phone, body);

        // Fallback: plantilla si la ventana se cerró.
        if (!result.ok) {
          result = await sendRecordatorio(phone, { cliente: cliente || "cliente", negocio, fecha: fechaStr, hora: horaStr });
        }

        await supabaseAdmin.from("wa_messages").insert({
          tenant_id: appt.tenant_id,
          owner_id: appt.owner_id ?? null,
          pet_id: appt.pet_id ?? null,
          appt_id: appt.id,
          type: "reminder",
          phone,
          body,
          status: result.ok ? "sent" : "failed",
          direction: "outbound",
          sent_at: new Date().toISOString(),
          error: result.ok ? null : result.error ?? "send failed",
        } as any);

        if (result.ok) sent++;
        else failed++;
      } catch (err: any) {
        console.error(`[reminders-1h] Error procesando cita ${appt.id}:`, err.message);
        failed++;
      }
    }

    console.log(`[reminders-1h] Completado: ${sent} enviados, ${failed} fallidos`);
    return NextResponse.json({ ok: true, sent, failed });
  } catch (err: any) {
    console.error("[reminders-1h] Error inesperado:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
