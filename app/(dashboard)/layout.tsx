// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import MobileHeader from "@/components/layout/MobileHeader";
import WelcomeTour from "@/components/dashboard/WelcomeTour";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Solo en Desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header - Solo en Mobile */}
        <MobileHeader />

        <main className="flex-1 overflow-auto pb-24 md:pb-6 pt-16 md:pt-0">
          {children}
        </main>
      </div>

      <BottomNav />
      <WelcomeTour />
    </div>
  );
}
