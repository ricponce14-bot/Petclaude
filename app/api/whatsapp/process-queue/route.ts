import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Service Role para acceso a todos los tenants sin RLS (necesario para leer config de sesiones ajenas/backend)
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
    return processQueue(req);
}

export async function POST(req: Request) {
    return processQueue(req);
}

async function processQueue(req: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const cookieStore = cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: "", ...options });
                    },
                },
            }
        );
        const { data: { session } } = await supabaseAuth.auth.getSession();

        let reqBody: any = {};
        if (req.method === "POST") {
            try {
                reqBody = await req.json();
            } catch (e) { }
        }

        // Proteger con CRON_SECRET o Sesion
        const authHeader = req.headers.get("authorization");
        const isCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

        if (!isCron && !session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let query = supabaseAdmin
            .from("wa_messages")
            .select("*") as any;

        if (reqBody.messageId) {
            query = query.eq("id", reqBody.messageId);
        } else {
            query = query.eq("status", "pending");
        }

        // Obtener hasta 50 mensajes
        const { data: pendingMessages, error: msgErr } = await query.limit(50);

        if (msgErr) throw new Error("Error fetching pending messages: " + msgErr.message);
        if (!pendingMessages || pendingMessages.length === 0) {
            return NextResponse.json({ message: "No pending messages.", results: { sent: 0, failed: 0 } });
        }

        // Extraer tenant_ids únicos y obtener sus instancias conectadas
        const tenantIds = Array.from(new Set(pendingMessages.map(m => m.tenant_id)));
        const { data: sessions } = await supabaseAdmin
            .from("wa_sessions")
            .select("tenant_id, instance, status")
            .in("tenant_id", tenantIds)
            .eq("status", "connected")
            .returns<any[]>();

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
                await supabaseAdmin
                    .from("wa_messages")
                    .update({
                        status: "failed",
                        error: "WhatsApp no conectado para esta veterinaria",
                        sent_at: new Date().toISOString()
                    } as any)
                    .eq("id", msg.id);
                results.failed++;
                continue;
            }

            try {
                const endpoint = msg.media_url ? "/message/sendMedia/" : "/message/sendText/";
                const payload = msg.media_url ? {
                    number: msg.phone,
                    media: msg.media_url,
                    caption: msg.body,
                    mediatype: "image", // Por ahora solo soportamos imagen en el chat
                    delay: 1200
                } : {
                    number: msg.phone,
                    text: msg.body,
                    delay: 1200
                };

                const sendRes = await fetch(`${apiUrl}${endpoint}${instanceName}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": apiKey
                    },
                    body: JSON.stringify(payload)
                });

                if (sendRes.ok) {
                    await supabaseAdmin
                        .from("wa_messages")
                        .update({ status: "sent", sent_at: new Date().toISOString(), error: null } as any)
                        .eq("id", msg.id);
                    results.sent++;
                } else {
                    const errData = await sendRes.text();
                    await supabaseAdmin
                        .from("wa_messages")
                        .update({ status: "failed", error: errData, sent_at: new Date().toISOString() } as any)
                        .eq("id", msg.id);
                    results.failed++;
                }
            } catch (e: any) {
                await supabaseAdmin
                    .from("wa_messages")
                    .update({ status: "failed", error: e.message, sent_at: new Date().toISOString() } as any)
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
