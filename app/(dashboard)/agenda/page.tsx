"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppointmentCard from "@/components/agenda/AppointmentCard";
import NewAppointmentModal from "@/components/agenda/NewAppointmentModal";
import type { Appointment } from "@/lib/supabase/types";

export default function AgendaPage() {
  const supabase = createClient();
  const [date, setDate]         = useState(new Date());
  const [appts, setAppts]       = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchAppointments(); }, [date]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*, pets(name, breed, temperament, allergies), owners(name, whatsapp)")
      .gte("scheduled_at", startOfDay(date).toISOString())
      .lte("scheduled_at", endOfDay(date).toISOString())
      .order("scheduled_at", { ascending: true });
    setAppts((data as any[]) ?? []);
    setLoading(false);
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(subDays(new Date(), 3), i));

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto space-y-4 pb-24 md:pb-8">

      {/* ── Header ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Agenda</h1>
          <p className="text-sm text-[#9e8a7a] font-medium mt-0.5 capitalize">
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
            {" "}·{" "}
            <span className="text-[#FF8C42] font-bold">
              {appts.length} cita{appts.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="hidden md:flex items-center gap-2 bg-[#FF8C42] text-white
                     px-5 py-2.5 rounded-[20px] text-sm font-bold
                     shadow-[0_8px_24px_rgba(255,140,66,0.30)]
                     hover:bg-[#E6722A] transition-colors"
        >
          <Plus size={17} strokeWidth={2.5} /> Nueva cita
        </motion.button>
      </motion.div>

      {/* ── Day Strip ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.06 }}
        className="flex items-center gap-2 bg-white border border-[#F0E6D8]
                   rounded-[32px] p-3 shadow-[0_4px_32px_rgba(0,0,0,0.06)]"
      >
        <button
          onClick={() => setDate(d => subDays(d, 1))}
          className="p-2 hover:bg-[#FFF3E3] rounded-[14px] transition-colors text-[#9e8a7a]
                     hover:text-[#FF8C42] shrink-0"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-1.5 overflow-x-auto flex-1 pb-0.5 scrollbar-hide">
          {days.map(d => {
            const isActive = isSameDay(d, date);
            return (
              <motion.button
                key={d.toISOString()}
                onClick={() => setDate(d)}
                whileTap={{ scale: 0.94 }}
                className={`flex flex-col items-center px-3.5 py-2.5 rounded-[18px]
                            text-xs font-bold min-w-[58px] transition-all duration-200
                            ${isActive
                              ? "bg-[#FF8C42] text-white shadow-[0_8px_20px_-4px_rgba(255,140,66,0.45)] -translate-y-0.5"
                              : "text-[#9e8a7a] hover:bg-[#FFF3E3] hover:text-[#FF8C42]"
                            }`}
              >
                <span className="uppercase tracking-widest opacity-80 text-[9px]">
                  {format(d, "EEE", { locale: es })}
                </span>
                <span className="text-xl mt-1 font-black">{format(d, "d")}</span>
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={() => setDate(d => addDays(d, 1))}
          className="p-2 hover:bg-[#FFF3E3] rounded-[14px] transition-colors text-[#9e8a7a]
                     hover:text-[#FF8C42] shrink-0"
        >
          <ChevronRight size={20} />
        </button>
      </motion.div>

      {/* ── Citas ──────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 rounded-[28px] bg-[#FFF3E3] animate-pulse" />
          ))}
        </div>
      ) : appts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 rounded-[32px] bg-white border border-[#F0E6D8]"
        >
          <div className="inline-flex w-14 h-14 rounded-[18px] bg-[#FFF4EC] items-center justify-center mb-3">
            <CalendarDays size={24} className="text-[#FF8C42]" />
          </div>
          <p className="text-[#9e8a7a] font-medium text-sm">No hay citas este día</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-sm font-bold text-[#FF8C42] hover:text-[#E6722A] transition-colors"
          >
            + Agendar una cita
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          <AnimatePresence>
            {appts.map(appt => (
              <motion.div
                key={appt.id}
                variants={{
                  hidden:  { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.36 } },
                }}
              >
                <AppointmentCard appt={appt} onUpdate={fetchAppointments} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {showModal && (
        <NewAppointmentModal
          defaultDate={date}
          onClose={() => setShowModal(false)}
          onCreated={fetchAppointments}
        />
      )}

      {/* ── FAB Mobile ─────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-20 right-4 z-40
                   w-14 h-14 bg-[#FF8C42] text-white rounded-[20px]
                   shadow-[0_8px_24px_rgba(255,140,66,0.45)]
                   flex items-center justify-center"
        aria-label="Nueva cita"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
