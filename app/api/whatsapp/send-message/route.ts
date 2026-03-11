import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { owner_id, pet_id, body } = await req.json();
        const tenantId = session.user.app_metadata?.tenant_id || session.user.user_metadata?.tenant_id;

        if (!tenantId) {
            return NextResponse.json({ error: "No se encontró tu veterinaria" }, { status: 400 });
        }
        if (!owner_id || !body) {
            return NextResponse.json({ error: "Cliente y mensaje son requeridos" }, { status: 400 });
        }

        // Obtener el teléfono del dueño
        const { data: owner } = await supabase
            .from("owners")
            .select("whatsapp, name")
            .eq("id", owner_id)
            .single();

        if (!owner?.whatsapp) {
            return NextResponse.json({ error: "El cliente no tiene WhatsApp registrado" }, { status: 400 });
        }

        // Insertar en la cola de mensajes
        const { error: insertErr } = await supabase.from("wa_messages").insert({
            tenant_id: tenantId,
            owner_id,
            pet_id: pet_id || null,
            type: "manual",
            phone: owner.whatsapp,
            body,
            status: "pending"
        } as any);

        if (insertErr) {
            return NextResponse.json({ error: "Error al crear mensaje: " + insertErr.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, message: "Mensaje agregado a la cola de envío" });
    } catch (error: any) {
        console.error("Send message error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
