"use client";
// app/(dashboard)/agenda/page.tsx
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AppointmentCard from "@/components/agenda/AppointmentCard";
import NewAppointmentModal from "@/components/agenda/NewAppointmentModal";
import type { Appointment } from "@/lib/supabase/types";

export default function AgendaPage() {
  const supabase = createClient();
  const [date, setDate] = useState(new Date());
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [date]);

  const fetchAppointments = async () => {
    setLoading(true);
    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();
    const { data } = await supabase
      .from("appointments")
      .select("*, pets(name, breed, temperament, allergies), owners(name, whatsapp)")
      .gte("scheduled_at", start)
      .lte("scheduled_at", end)
      .order("scheduled_at", { ascending: true });
    setAppts((data as any[]) ?? []);
    setLoading(false);
  };

  // Mini calendar strip (7 días)
  const days = Array.from({ length: 7 }, (_, i) => addDays(subDays(new Date(), 3), i));

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 md:space-y-8 pb-24 md:pb-8">
      {/* Header Premium */}
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Agenda</h1>
          <p className="text-xs md:text-sm font-semibold text-slate-500 mt-0.5 md:mt-1 capitalize">
            {format(date, "EEEE d 'de' MMMM", { locale: es })} — <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">{appts.length} cita{appts.length !== 1 ? "s" : ""}</span>
          </p>
        </div>
        {/* Botón solo visible en desktop */}
        <button
          onClick={() => setShowModal(true)}
          className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-soft-purple hover:bg-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl"
        >
          <Plus size={18} /> Nueva cita
        </button>
      </div>

      {/* Day strip Orgánico */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-3xl shadow-soft-teal border border-slate-100">
        <button onClick={() => setDate(d => subDays(d, 1))} className="p-2 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400 hover:text-slate-700">
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-2 overflow-x-auto flex-1 pb-1 scrollbar-hide">
          {days.map(d => (
            <button
              key={d.toISOString()}
              onClick={() => setDate(d)}
              className={`flex flex-col items-center px-4 py-3 rounded-2xl text-xs font-bold min-w-[64px] transition-all duration-300 ${isSameDay(d, date)
                ? "bg-teal-500 text-white shadow-[0_8px_20px_-6px_rgba(20,184,166,0.5)] transform -translate-y-1"
                : "bg-transparent text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100"
                }`}
            >
              <span className="opacity-80 uppercase tracking-widest">{format(d, "EEE", { locale: es })}</span>
              <span className="text-xl mt-1">{format(d, "d")}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setDate(d => addDays(d, 1))} className="p-2 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400 hover:text-slate-700">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Appointments */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : appts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p>No hay citas este día</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-teal-600 text-sm hover:underline">
            + Agendar una cita
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {appts.map(appt => (
            <AppointmentCard key={appt.id} appt={appt} onUpdate={fetchAppointments} />
          ))}
        </div>
      )}

      {showModal && (
        <NewAppointmentModal
          defaultDate={date}
          onClose={() => setShowModal(false)}
          onCreated={fetchAppointments}
        />
      )}

      {/* FAB — Solo mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-teal-500 text-white rounded-2xl shadow-lg shadow-teal-500/30 flex items-center justify-center hover:bg-teal-600 active:scale-95 transition-all"
        aria-label="Nueva cita"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  );
}
