// app/(dashboard)/ajustes/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import AjustesForm from "./AjustesForm";

export default async function AjustesPage() {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    const tenantId = session?.user.app_metadata?.tenant_id;
    let tenant: any = null;

    if (tenantId) {
        const admin = getSupabaseAdmin();
        const { data } = await admin
            .from("tenants")
            .select("id, name, email, city, phone, plan, created_at")
            .eq("id", tenantId)
            .single();
        tenant = data;
    }

    return (
        <div className="px-4 py-5 md:px-6 md:py-6 max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-ink tracking-tight">Ajustes</h1>
                <p className="text-slate-500 text-sm mt-1">Configura los datos de tu negocio</p>
            </div>

            <AjustesForm tenant={tenant} userEmail={session?.user.email ?? ""} />
        </div>
    );
}
