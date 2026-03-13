import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { owner_id, pet_id, phone: manualPhone, body, media_url } = await req.json();
        const tenantId = session.user.app_metadata?.tenant_id || session.user.user_metadata?.tenant_id;

        if (!tenantId) {
            return NextResponse.json({ error: "No se encontró tu veterinaria" }, { status: 400 });
        }
        if ((!owner_id && !manualPhone) || !body) {
            return NextResponse.json({ error: "Cliente y mensaje son requeridos" }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        let finalPhone = manualPhone;

        if (owner_id) {
            // Obtener datos del dueño (BYPASS RLS con Admin)
            const { data: owner, error: ownerErr } = await supabaseAdmin
                .from("owners")
                .select("*")
                .eq("id", owner_id)
                .single();

            if (ownerErr) {
                return NextResponse.json({ error: "Error buscando cliente: " + ownerErr.message }, { status: 500 });
            }

            finalPhone = (owner as any)?.whatsapp || (owner as any)?.phone || (owner as any)?.telefono || null;
        }

        if (!finalPhone) {
            return NextResponse.json({
                error: "No se encontró un número de teléfono válido para este envío.",
            }, { status: 400 });
        }

        // Limpiar teléfono
        finalPhone = finalPhone.replace(/\D/g, "");

        // Insertar en la cola de mensajes (BYPASS RLS con Admin)
        const { data: newMsg, error: insertErr } = await supabaseAdmin.from("wa_messages").insert({
            tenant_id: tenantId,
            owner_id: owner_id || null,
            pet_id: pet_id || null, 
            type: "manual",
            phone: finalPhone,
            body,
            media_url: media_url || null,
            status: "pending"
        } as any).select().single();

        if (insertErr) {
            console.error("Insert error:", insertErr);
            return NextResponse.json({ error: "Error al crear mensaje: " + insertErr.message }, { status: 500 });
        }

        // Auto-procesar la cola inmediatamente para que el usuario no tenga que ir a Outbox
        try {
            if (newMsg) {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get("origin") || "http://localhost:3000";
                fetch(`${baseUrl}/api/whatsapp/process-queue`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.CRON_SECRET}`
                    },
                    body: JSON.stringify({ messageId: (newMsg as any).id })
                }).catch(e => console.error("Fallo silencioso al auto-procesar cola:", e));
            }
        } catch (e) { }

        return NextResponse.json({ ok: true, message: "Mensaje procesado en la cola de envío" });
    } catch (error: any) {
        console.error("Send message error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
