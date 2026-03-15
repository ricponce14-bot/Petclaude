// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import MobileHeader from "@/components/layout/MobileHeader";
import WelcomeTour from "@/components/dashboard/WelcomeTour";
import TrialBanner from "@/components/dashboard/TrialBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  // ── Verificar plan del tenant ──────────────────────────────────
  const tenantId = session.user.app_metadata?.tenant_id;
  let plan = "trial";
  let trialEndsAt: string | null = null;

  if (tenantId) {
    const admin = getSupabaseAdmin();
    const { data: tenant } = await admin
      .from("tenants")
      .select("plan, trial_ends_at")
      .eq("id", tenantId)
      .single();

    plan = (tenant as any)?.plan ?? "trial";
    trialEndsAt = (tenant as any)?.trial_ends_at ?? null;
  }

  // ── Calcular días restantes ────────────────────────────────────
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0;

  const trialExpired = plan === "trial" && daysLeft === 0;

  // ── Bloquear si trial expiró (excepto en /membresia y /ajustes) ─
  const headerList = headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const isExempt = pathname.startsWith("/membresia") || pathname.startsWith("/ajustes");

  if (trialExpired && !isExempt) {
    redirect("/membresia");
  }

  // ── Mostrar banner de advertencia (últimos 3 días o past_due) ──
  const showBanner =
    (plan === "trial" && daysLeft <= 3 && daysLeft > 0) ||
    plan === "past_due";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#FFF9F0" }}>
      {/* Sidebar - Solo en Desktop */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header - Solo en Mobile */}
        <MobileHeader />

        <main className="flex-1 overflow-auto pb-24 md:pb-6 pt-16 md:pt-0">
          {showBanner && (
            <TrialBanner plan={plan} daysLeft={daysLeft} />
          )}
          {children}
        </main>
      </div>

      <BottomNav />
      <WelcomeTour />
    </div>
  );
}
