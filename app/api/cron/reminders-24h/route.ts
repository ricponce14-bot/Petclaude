// app/api/cron/reminders-24h/route.ts
// Envía recordatorios de WhatsApp 24h antes de cada cita
// Debe ejecutarse cada hora via Vercel Cron o pg_cron
// Protegido con CRON_SECRET

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { startReminderConfirmation } from "@/lib/whatsapp-bot/engine";
import { toZonedTime, format } from "date-fns-tz";
import { es } from "date-fns/locale";

const MEXICO_TZ = "America/Mexico_City";

export async function GET(req: Request) {
    return runReminders(req);
}

export async function POST(req: Request) {
    return runReminders(req);
}

async function runReminders(req: Request) {
    // Verificar CRON_SECRET
    const authHeader = req.headers.get("authorization");
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();

        // Ventana amplia: 22h–26h para no perder citas si el cron se ejecuta con minutos de diferencia
        const now = new Date();
        const windowStart = new Date(now.getTime() + 22 * 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

        // Buscar citas pendientes que NO tienen reminder_sent y están en la ventana
        const { data: appointments, error } = await supabaseAdmin
            .from("appointments")
            .select("*, owner:owners(*), pet:pets(*)")
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
                const ownerPhone: string | null = appt.owner?.whatsapp || appt.owner?.phone || null;
                if (!ownerPhone) {
                    console.warn(`[reminders-24h] Cita ${appt.id}: sin teléfono del dueño`);
                    continue;
                }

                // Formatear fecha/hora en timezone México
                // toZonedTime ya convierte al timezone — format no necesita timeZone de nuevo
                const apptMexicoTime = toZonedTime(new Date(appt.scheduled_at), MEXICO_TZ);
                const fechaStr = format(apptMexicoTime, "EEEE d 'de' MMMM", { locale: es });
                const horaStr = format(apptMexicoTime, "h:mm a");
                const petName: string = appt.pet?.name ?? "tu mascota";
                const serviceLabel: string = appt.type ?? "servicio";

                const reminderBody =
                    `🐾 *Recordatorio de cita*\n\n` +
                    `Hola ${appt.owner?.name ?? ""}! Te recordamos que mañana tienes cita para *${petName}*.\n\n` +
                    `📋 Servicio: *${serviceLabel}*\n` +
                    `📅 Fecha: *${fechaStr}*\n` +
                    `🕐 Hora: *${horaStr}*\n\n` +
                    `¿Confirmas tu asistencia? Responde:\n` +
                    `✅ *SÍ* — confirmo\n` +
                    `🔄 *NO* — necesito reagendar`;

                // Insertar mensaje en la cola wa_messages
                const { error: msgErr } = await supabaseAdmin
                    .from("wa_messages")
                    .insert({
                        tenant_id: appt.tenant_id,
                        owner_id: appt.owner_id,
                        pet_id: appt.pet_id,
                        appt_id: appt.id,
                        type: "reminder",
                        phone: ownerPhone.replace(/\D/g, ""),
                        body: reminderBody,
                        status: "pending",
                        direction: "outbound",
                    } as any);

                if (msgErr) {
                    console.error(`[reminders-24h] Error insertando mensaje para cita ${appt.id}:`, msgErr.message);
                    failed++;
                    continue;
                }

                // Poner la sesión en estado "esperando_confirmacion"
                await startReminderConfirmation(
                    ownerPhone.replace(/\D/g, ""),
                    appt.tenant_id,
                    appt.id
                );

                // Marcar reminder_sent = true
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

        // Disparar process-queue para enviar los mensajes recién encolados
        if (sent > 0) {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
            fetch(`${baseUrl}/api/whatsapp/process-queue`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.CRON_SECRET}`,
                },
            }).catch((e) => console.error("[reminders-24h] Fallo al disparar process-queue:", e));
        }

        console.log(`[reminders-24h] Completado: ${sent} enviados, ${failed} fallidos`);
        return NextResponse.json({ ok: true, sent, failed });

    } catch (err: any) {
        console.error("[reminders-24h] Error inesperado:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
