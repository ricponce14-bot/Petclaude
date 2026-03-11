// app/api/whatsapp/fetch-qr/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: waSession } = await supabase.from("wa_sessions").select("*").single();
    if (!waSession) return NextResponse.json({ error: "No hay instancia creada" }, { status: 404 });

    const instanceName = (waSession as any).instance;

    try {
        // Solo verificar el ESTADO de la instancia, NO reconectar
        const res = await fetch(
            `${process.env.EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`,
            {
                method: "GET",
                headers: { apikey: process.env.EVOLUTION_API_KEY! },
            }
        );

        if (!res.ok) {
            return NextResponse.json({ error: "Error consultando instancia" }, { status: 500 });
        }

        const data = await res.json();
        const instance = Array.isArray(data) ? data[0] : data;
        const connectionStatus = instance?.connectionStatus;

        // Si ya está conectada, actualizar el status
        if (connectionStatus === "open") {
            await supabase.from("wa_sessions").update({
                status: "connected",
                updated_at: new Date().toISOString(),
            } as any).eq("instance", instanceName);
            return NextResponse.json({ ok: true, status: "connected" });
        }

        return NextResponse.json({ ok: true, status: connectionStatus || "unknown" });
    } catch (err: any) {
        return NextResponse.json({ error: "Fallo al consultar instancia: " + err.message }, { status: 500 });
    }
}
