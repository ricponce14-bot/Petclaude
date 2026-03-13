import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.user.app_metadata?.tenant_id || session.user.user_metadata?.tenant_id;
        if (!tenantId) return NextResponse.json({ error: "No se encontró tu veterinaria" }, { status: 400 });

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Obtener la sesión actual para saber el nombre de la instancia
        const { data: waSession } = await supabaseAdmin
            .from("wa_sessions")
            .select("*")
            .eq("tenant_id", tenantId)
            .single();

        if (!waSession) {
            return NextResponse.json({ error: "No hay una instancia activa" }, { status: 404 });
        }

        const instanceName = (waSession as any).instance;
        const apiUrl = process.env.EVOLUTION_API_URL;
        const apiKey = process.env.EVOLUTION_API_KEY;

        // 2. Notificar a Evolution API para borrar/desconectar
        try {
            await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
                method: "DELETE",
                headers: { "apikey": apiKey! }
            });
            await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
                method: "DELETE",
                headers: { "apikey": apiKey! }
            });
        } catch (e) {
            console.error("Error calling Evolution API for deletion:", e);
        }

        // 3. Borrar de nuestra base de datos
        await supabaseAdmin
            .from("wa_sessions")
            .delete()
            .eq("tenant_id", tenantId);

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("Delete instance error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
