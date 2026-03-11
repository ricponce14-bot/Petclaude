// app/(dashboard)/dashboard/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CalendarDays, Users, PawPrint, MessageCircle } from "lucide-react";
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
    { label: "Clientes", value: totalOwners ?? 0, icon: Users, href: "/clientes", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Mascotas", value: totalPets ?? 0, icon: PawPrint, href: "/mascotas", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Citas hoy", value: todayAppts?.length ?? 0, icon: CalendarDays, href: "/agenda", color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Mensajes pendientes", value: pendingMessages ?? 0, icon: MessageCircle, href: "/mensajes", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header Premium */}
      <div className="mb-10 relative">
        <h1 className="text-4xl font-black text-gradient tracking-tight">Buenos días 👋</h1>
        <p className="text-slate-500 font-semibold text-base mt-2">{format(today, "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
      </div>

      {/* Stats Cards Premium */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href}
            className="glass rounded-3xl p-6 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden shadow-soft-teal hover:shadow-xl">
            <div className={`absolute top-0 right-0 w-24 h-24 ${bg} rounded-bl-full opacity-40 transition-transform duration-500 group-hover:scale-125`} />
            <div className={`inline-flex p-3.5 rounded-2xl ${bg} mb-5 relative z-10 transform group-hover:-rotate-6 transition-transform duration-500`}>
              <Icon size={24} className={color} strokeWidth={2.5} />
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10 leading-none">{value}</p>
            <p className="text-sm text-slate-500 font-bold mt-2 relative z-10">{label}</p>
          </Link>
        ))}
      </div>

      {/* Citas del día Premium */}
      <div className="bg-white/80 backdrop-blur-xl border border-white shadow-soft-purple rounded-[2rem] overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-xl tracking-tight">Citas de hoy</h2>
          <Link href="/agenda" className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors bg-teal-50 px-4 py-2 rounded-xl hover:bg-teal-100">
            Ver agenda entera
          </Link>
        </div>

        {!todayAppts?.length ? (
          <div className="text-center py-16">
            <div className="inline-flex w-16 h-16 rounded-full bg-gray-50 text-gray-300 items-center justify-center mb-3">
              <CalendarDays size={32} />
            </div>
            <p className="text-gray-500 font-medium text-sm">No hay citas programadas para hoy</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100/50">
            {todayAppts.map((appt: any) => (
              <li key={appt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/50 transition-colors">
                <span className="text-sm font-black text-gray-400 w-16 shrink-0 bg-gray-50 px-2 py-1 rounded-md text-center">
                  {format(new Date(appt.scheduled_at), "HH:mm")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-base truncate">{appt.pets?.name}</p>
                  <p className="text-xs text-gray-500 font-medium">{appt.owners?.name} <span className="text-gray-300 mx-1">•</span> {appt.type}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {appt.pets?.allergies && (
                    <span className="text-[10px] uppercase tracking-wider bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">Alergia</span>
                  )}
                  {appt.pets?.temperament === "aggressive" && (
                    <span className="text-[10px] uppercase tracking-wider bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-bold">Cuidado</span>
                  )}
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${appt.status === "confirmed" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"
                    }`}>
                    {appt.status === "confirmed" ? "Confirmada" : "Agendada"}
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
