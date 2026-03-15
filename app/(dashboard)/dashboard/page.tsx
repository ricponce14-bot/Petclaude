// app/(dashboard)/dashboard/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CalendarDays, Users, PawPrint, MessageCircle, Sun } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

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
    supabase.from("appointments").select("*, pets(name, temperament, allergies), owners(name, whatsapp)")
      .gte("scheduled_at", startOfDay(today).toISOString())
      .lte("scheduled_at", endOfDay(today).toISOString())
      .order("scheduled_at", { ascending: true })
  ]);

  const stats = [
    {
      label: "Clientes",
      value: totalOwners ?? 0,
      icon: Users,
      href: "/clientes",
      cardBg: "bg-mint/10",
      iconBg: "bg-mint/20",
      iconColor: "text-mint",
      valueColor: "text-mint-dark",
    },
    {
      label: "Mascotas",
      value: totalPets ?? 0,
      icon: PawPrint,
      href: "/mascotas",
      cardBg: "bg-sand/10",
      iconBg: "bg-sand/20",
      iconColor: "text-sand-dark",
      valueColor: "text-sand-dark",
    },
    {
      label: "Citas hoy",
      value: todayAppts?.length ?? 0,
      icon: CalendarDays,
      href: "/agenda",
      cardBg: "bg-mint/10",
      iconBg: "bg-mint/20",
      iconColor: "text-mint",
      valueColor: "text-mint-dark",
    },
    {
      label: "Msgs. pendientes",
      value: pendingMessages ?? 0,
      icon: MessageCircle,
      href: "/mensajes",
      cardBg: "bg-sand/10",
      iconBg: "bg-sand/20",
      iconColor: "text-sand-dark",
      valueColor: "text-sand-dark",
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 md:space-y-8">

      {/* ─── Saludo ─── */}
      <div className="mb-2 md:mb-6">
        <h1 className="text-2xl md:text-4xl font-black text-ink tracking-tight flex items-center gap-2">
          <Sun size={26} className="text-sand shrink-0" strokeWidth={2.5} />
          Buenos días
        </h1>
        <p className="text-slate-500 font-semibold text-sm md:text-base mt-1 md:mt-2 capitalize">
          {format(today, "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map(({ label, value, icon: Icon, href, cardBg, iconBg, iconColor, valueColor }) => (
          <Link
            key={label}
            href={href}
            className={`${cardBg} rounded-xl p-4 md:p-5 border border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 group`}
          >
            {/* Fila superior: número + icono */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-3xl xs:text-4xl md:text-5xl font-extrabold leading-none tracking-tight text-ink">
                {value}
              </p>
              <div className={`${iconBg} p-2.5 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={20} className={iconColor} strokeWidth={2} />
              </div>
            </div>
            {/* Etiqueta */}
            <p className="text-xs md:text-sm text-slate-600 font-semibold leading-tight">{label}</p>
          </Link>
        ))}
      </div>

      {/* ─── Citas del día ─── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-ink text-base md:text-lg">Citas de hoy</h2>
          <Link
            href="/agenda"
            className="text-sm font-bold text-mint hover:text-mint-dark transition-colors"
          >
            Ver agenda →
          </Link>
        </div>

        {!todayAppts?.length ? (
          <div className="text-center py-14">
            <div className="inline-flex w-14 h-14 rounded-full bg-gray-50 text-slate-300 items-center justify-center mb-3">
              <CalendarDays size={28} />
            </div>
            <p className="text-slate-400 font-medium text-sm">No hay citas programadas para hoy</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {todayAppts.map((appt: any) => (
              <li key={appt.id} className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50/70 transition-colors">
                {/* Hora */}
                <span className="text-xs md:text-sm font-bold text-slate-400 w-12 md:w-14 shrink-0 text-center bg-slate-50 px-2 py-1 rounded-lg">
                  {format(new Date(appt.scheduled_at), "HH:mm")}
                </span>
                {/* Info mascota */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink text-sm md:text-base truncate">{appt.pets?.name}</p>
                  <p className="text-xs text-slate-400 font-medium truncate">
                    {appt.owners?.name}
                    <span className="mx-1 text-slate-200">·</span>
                    {appt.type}
                  </p>
                </div>
                {/* Badges */}
                <div className="flex gap-1.5 items-center shrink-0">
                  {appt.pets?.allergies && (
                    <span className="text-[10px] uppercase tracking-wide bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold hidden xs:inline">
                      Alergia
                    </span>
                  )}
                  {appt.pets?.temperament === "aggressive" && (
                    <span className="text-[10px] uppercase tracking-wide bg-sand/15 text-sand-dark px-2 py-0.5 rounded-full font-bold hidden xs:inline">
                      Cuidado
                    </span>
                  )}
                  <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold ${
                    appt.status === "confirmed"
                      ? "bg-mint/10 text-mint"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {appt.status === "confirmed" ? "✓ conf." : "• pend."}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
