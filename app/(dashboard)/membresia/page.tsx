// app/(dashboard)/membresia/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import MembresiaClient from "./MembresiaClient";

export default async function MembresiaPage() {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    const tenantId = session?.user.app_metadata?.tenant_id;
    let tenant: any = null;

    if (tenantId) {
        const admin = getSupabaseAdmin();
        const { data } = await admin
            .from("tenants")
            .select("id, plan, trial_ends_at, created_at")
            .eq("id", tenantId)
            .single();
        tenant = data;
    }

    return <MembresiaClient tenant={tenant} userEmail={session?.user.email ?? ""} userId={session?.user.id ?? ""} />;
}
