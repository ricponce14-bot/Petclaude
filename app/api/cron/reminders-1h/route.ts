// app/api/cron/reminders-1h/route.ts
// Envía recordatorio de "ya casi es tu cita" 1 hora antes
// Solo para citas con status "confirmed" (el cliente ya confirmó)

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { toZonedTime, format } from "date-fns-tz";

const MEXICO_TZ = "America/Mexico_City";

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

        // Ventana: citas que ocurren entre 50min y 70min desde ahora
        const now = new Date();
        const windowStart = new Date(now.getTime() + 50 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + 70 * 60 * 1000);

        const { data: appointments, error } = await supabaseAdmin
            .from("appointments")
            .select("*, owner:owners(*), pet:pets(*)")
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
                const ownerPhone: string | null = appt.owner?.whatsapp || appt.owner?.phone || null;
                if (!ownerPhone) continue;

                const apptMexicoTime = toZonedTime(new Date(appt.scheduled_at), MEXICO_TZ);
                const horaStr = format(apptMexicoTime, "h:mm a");
                const petName: string = appt.pet?.name ?? "tu mascota";

                const body =
                    `⏰ *¡Tu cita es en 1 hora!*\n\n` +
                    `Hola ${appt.owner?.name ?? ""}! En menos de una hora es la cita de *${petName}* a las *${horaStr}*.\n\n` +
                    `¡Te esperamos! 🐾`;

                await supabaseAdmin
                    .from("wa_messages")
                    .insert({
                        tenant_id: appt.tenant_id,
                        owner_id: appt.owner_id,
                        pet_id: appt.pet_id,
                        appt_id: appt.id,
                        type: "reminder",
                        phone: ownerPhone.replace(/\D/g, ""),
                        body,
                        status: "pending",
                        direction: "outbound",
                    } as any);

                sent++;
            } catch (err: any) {
                console.error(`[reminders-1h] Error procesando cita ${appt.id}:`, err.message);
                failed++;
            }
        }

        if (sent > 0) {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
            fetch(`${baseUrl}/api/whatsapp/process-queue`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.CRON_SECRET}`,
                },
            }).catch((e) => console.error("[reminders-1h] Fallo al disparar process-queue:", e));
        }

        console.log(`[reminders-1h] Completado: ${sent} enviados, ${failed} fallidos`);
        return NextResponse.json({ ok: true, sent, failed });

    } catch (err: any) {
        console.error("[reminders-1h] Error inesperado:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
