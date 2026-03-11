import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service Role para acceso a todos los tenants sin RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    return processQueue(req);
}

export async function POST(req: Request) {
    return processQueue(req);
}

async function processQueue(req: Request) {
    try {
        // Proteger con CRON_SECRET (Vercel Cron envía Authorization: Bearer <secret>)
        const authHeader = req.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Obtener hasta 50 mensajes pendientes
        const { data: pendingMessages, error: msgErr } = await supabase
            .from("wa_messages")
            .select("*")
            .eq("status", "pending")
            .limit(50);

        if (msgErr) throw new Error("Error fetching pending messages: " + msgErr.message);
        if (!pendingMessages || pendingMessages.length === 0) {
            return NextResponse.json({ message: "No pending messages.", results: { sent: 0, failed: 0 } });
        }

        // Extraer tenant_ids únicos y obtener sus instancias conectadas
        const tenantIds = Array.from(new Set(pendingMessages.map(m => m.tenant_id)));
        const { data: sessions } = await supabase
            .from("wa_sessions")
            .select("tenant_id, instance, status")
            .in("tenant_id", tenantIds)
            .eq("status", "connected");

        // Mapa rápido de tenants a su instancia conectada
        const tenantSessions = (sessions || []).reduce((acc: Record<string, string>, session: any) => {
            acc[session.tenant_id] = session.instance;
            return acc;
        }, {});

        const results = { sent: 0, failed: 0, skipped: 0 };
        const apiUrl = process.env.EVOLUTION_API_URL!;
        const apiKey = process.env.EVOLUTION_API_KEY!;

        // Procesar cada mensaje
        for (const msg of pendingMessages) {
            const instanceName = tenantSessions[msg.tenant_id];

            if (!instanceName) {
                // WhatsApp no conectado — marcar como fallido
                await supabase
                    .from("wa_messages")
                    .update({
                        status: "failed",
                        error: "WhatsApp no conectado para esta veterinaria",
                        sent_at: new Date().toISOString()
                    })
                    .eq("id", msg.id);
                results.failed++;
                continue;
            }

            try {
                const sendRes = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": apiKey
                    },
                    body: JSON.stringify({
                        number: msg.phone,
                        text: msg.body,
                        delay: 1200
                    })
                });

                if (sendRes.ok) {
                    await supabase
                        .from("wa_messages")
                        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
                        .eq("id", msg.id);
                    results.sent++;
                } else {
                    const errData = await sendRes.text();
                    await supabase
                        .from("wa_messages")
                        .update({ status: "failed", error: errData, sent_at: new Date().toISOString() })
                        .eq("id", msg.id);
                    results.failed++;
                }
            } catch (e: any) {
                await supabase
                    .from("wa_messages")
                    .update({ status: "failed", error: e.message, sent_at: new Date().toISOString() })
                    .eq("id", msg.id);
                results.failed++;
            }
        }

        return NextResponse.json({ message: "Queue processed", results });
    } catch (error: any) {
        console.error("Process Queue Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
