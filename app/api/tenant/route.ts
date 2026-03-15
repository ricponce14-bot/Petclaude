// app/api/tenant/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: Request) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const tenantId = session.user.app_metadata?.tenant_id;
        if (!tenantId) {
            return NextResponse.json({ error: "Tenant no encontrado" }, { status: 400 });
        }

        const { name, city, phone } = await req.json();

        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
            .from("tenants")
            .update({ name, city: city || null, phone: phone || null } as any)
            .eq("id", tenantId);

        if (error) {
            console.error("[tenant PATCH]", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
