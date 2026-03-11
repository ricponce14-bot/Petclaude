import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { appointment_id, tenant_id } = await req.json();

        if (!appointment_id || !tenant_id) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        // Obtener la cita con datos de mascota y dueño
        const { data: appt, error: apptErr } = await supabase
            .from("appointments")
            .select("*, pets(name, breed), owners(name, whatsapp)")
            .eq("id", appointment_id)
            .single();

        if (apptErr || !appt) {
            return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
        }

        const ownerName = (appt as any).owners?.name || "Cliente";
        const petName = (appt as any).pets?.name || "Mascota";
        const phone = (appt as any).owners?.whatsapp;

        if (!phone) {
            return NextResponse.json({ error: "El cliente no tiene WhatsApp registrado" }, { status: 400 });
        }

        // Mapeo de tipos de servicio
        const typeLabels: Record<string, string> = {
            bath: "🛁 Baño",
            haircut: "✂️ Corte",
            bath_haircut: "🛁✂️ Baño + Corte",
            vaccine: "💉 Vacunación",
            checkup: "🔍 Chequeo general",
            other: "📋 Otro servicio"
        };

        const serviceType = typeLabels[appt.type] || appt.type;
        const price = appt.price ? `$${Number(appt.price).toFixed(2)} MXN` : "Por confirmar";
        const date = new Date(appt.scheduled_at).toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        // Construir el ticket
        const ticketBody = `🐾 *TICKET DE SERVICIO — Ladrido*\n` +
            `━━━━━━━━━━━━━━━━━\n` +
            `👤 *Cliente:* ${ownerName}\n` +
            `🐕 *Mascota:* ${petName}\n` +
            `📋 *Servicio:* ${serviceType}\n` +
            `💰 *Total:* ${price}\n` +
            `📅 *Fecha:* ${date}\n` +
            `━━━━━━━━━━━━━━━━━\n` +
            `${appt.notes ? `📝 *Notas:* ${appt.notes}\n` : ""}` +
            `\n¡Gracias por confiar en nosotros! 🤗\n` +
            `Tu próxima cita la puedes agendar respondiendo a este mensaje.`;

        // Insertar en wa_messages
        const { error: insertErr } = await supabase.from("wa_messages").insert({
            tenant_id,
            owner_id: appt.owner_id,
            pet_id: appt.pet_id,
            appt_id: appointment_id,
            type: "manual",
            phone,
            body: ticketBody,
            status: "pending"
        });

        if (insertErr) {
            return NextResponse.json({ error: "Error al crear mensaje: " + insertErr.message }, { status: 500 });
        }

        // Intentar envío inmediato si la instancia está conectada
        const { data: waSession } = await supabase
            .from("wa_sessions")
            .select("instance, status")
            .eq("tenant_id", tenant_id)
            .eq("status", "connected")
            .single();

        if (waSession) {
            const apiUrl = process.env.EVOLUTION_API_URL!;
            const apiKey = process.env.EVOLUTION_API_KEY!;

            try {
                const sendRes = await fetch(`${apiUrl}/message/sendText/${waSession.instance}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", apikey: apiKey },
                    body: JSON.stringify({ number: phone, text: ticketBody, delay: 1200 })
                });

                if (sendRes.ok) {
                    // Actualizar el último mensaje insertado como enviado
                    await supabase
                        .from("wa_messages")
                        .update({ status: "sent", sent_at: new Date().toISOString() })
                        .eq("appt_id", appointment_id)
                        .eq("type", "manual")
                        .eq("status", "pending");

                    return NextResponse.json({ ok: true, sent: true, message: "Ticket enviado exitosamente" });
                }
            } catch (e) {
                // No falla, queda en cola para process-queue
                console.error("Error en envío inmediato:", e);
            }
        }

        return NextResponse.json({ ok: true, sent: false, message: "Ticket en cola de envío" });
    } catch (error: any) {
        console.error("Send ticket error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
