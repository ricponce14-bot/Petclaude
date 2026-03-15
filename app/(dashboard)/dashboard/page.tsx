// app/(dashboard)/dashboard/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CalendarDays, Users, PawPrint, MessageCircle } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { StatCard } from "@/components/ui/MotionCard";
import MotionCard from "@/components/ui/MotionCard";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const today = new Date();

  const [
    { count: totalOwners },
    { count: totalPets },
    { count: pendingMessages },
    { data: todayAppts }
  ] = await Promise.all([
    supabase.from("owners").select("*", { count: "exact", head: true }),
    supabase.from("pets").select("*", { count: "exact", head: true }),
    supabase.from("wa_messages").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("appointments")
      .select("*, pets(name, temperament, allergies), owners(name, whatsapp)")
      .gte("scheduled_at", startOfDay(today).toISOString())
      .lte("scheduled_at", endOfDay(today).toISOString())
      .order("scheduled_at", { ascending: true })
  ]);

  const todayStr = format(today, "EEEE d 'de' MMMM, yyyy", { locale: es });

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Saludo ─────────────────────────────────────── */}
      <DashboardGreeting dateStr={todayStr} />

      {/* ── Stats — 2×2 mobile, 4×1 desktop ────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Link href="/clientes">
          <StatCard label="Clientes"          value={totalOwners ?? 0}     icon={<Users size={18} />}         color="orange" delay={0.05} />
        </Link>
        <Link href="/mascotas">
          <StatCard label="Mascotas"          value={totalPets ?? 0}       icon={<PawPrint size={18} />}      color="purple" delay={0.10} />
        </Link>
        <Link href="/agenda">
          <StatCard label="Citas hoy"         value={todayAppts?.length ?? 0} icon={<CalendarDays size={18} />} color="teal"   delay={0.15} />
        </Link>
        <Link href="/mensajes">
          <StatCard label="Msgs. pendientes"  value={pendingMessages ?? 0} icon={<MessageCircle size={18} />} color="orange" delay={0.20} />
        </Link>
      </div>

      {/* ── Citas del día ──────────────────────────────── */}
      <MotionCard delay={0.25} className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0E6D8]">
          <h2 className="font-black text-[#1A1A1A] text-base md:text-lg">Citas de hoy</h2>
          <Link
            href="/agenda"
            className="text-sm font-bold text-[#FF8C42] hover:text-[#E6722A] transition-colors"
          >
            Ver agenda →
          </Link>
        </div>

        {!todayAppts?.length ? (
          <div className="text-center py-14 px-6">
            <div className="inline-flex w-14 h-14 rounded-[18px] bg-[#FFF4EC] text-[#FF8C42] items-center justify-center mb-3">
              <CalendarDays size={26} />
            </div>
            <p className="text-[#9e8a7a] font-medium text-sm">No hay citas programadas para hoy</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0E6D8]">
            {(todayAppts as any[]).map((appt, i) => (
              <li
                key={appt.id}
                className="flex items-center gap-3 px-6 py-3.5 hover:bg-[#FFF9F0] transition-colors"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Hora */}
                <span className="text-xs font-black text-[#FF8C42] w-12 shrink-0 text-center
                                 bg-orange-50 border border-orange-100 px-2 py-1.5 rounded-[12px]">
                  {format(new Date(appt.scheduled_at), "HH:mm")}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1A1A1A] text-sm truncate">{appt.pets?.name}</p>
                  <p className="text-xs text-[#9e8a7a] font-medium truncate">
                    {appt.owners?.name}
                    <span className="mx-1.5 text-[#F0E6D8]">·</span>
                    {appt.type}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex gap-1.5 items-center shrink-0">
                  {appt.pets?.allergies && (
                    <span className="hidden xs:inline text-[10px] uppercase tracking-wide
                                     bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">
                      Alergia
                    </span>
                  )}
                  {appt.pets?.temperament === "aggressive" && (
                    <span className="hidden xs:inline text-[10px] uppercase tracking-wide
                                     bg-orange-50 text-[#FF8C42] px-2 py-0.5 rounded-full font-bold">
                      Cuidado
                    </span>
                  )}
                  <span className={`text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full font-bold ${
                    appt.status === "confirmed"
                      ? "bg-teal-50 text-[#00C4AA]"
                      : "bg-[#FFF4EC] text-[#FF8C42]"
                  }`}>
                    {appt.status === "confirmed" ? "✓ conf." : "• pend."}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </MotionCard>

    </div>
  );
}
