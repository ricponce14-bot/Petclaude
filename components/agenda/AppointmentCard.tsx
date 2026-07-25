"use client";
import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Phone, Send, Loader2, Clock, User } from "lucide-react";
import type { Appointment } from "@/lib/supabase/types";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  scheduled: { label: "Agendada",   bg: "bg-orange-50",  text: "text-[#E8542F]" },
  confirmed: { label: "Confirmada", bg: "bg-teal-50",    text: "text-[#0E8C6D]" },
  completed: { label: "Completada", bg: "bg-[#F0F0F0]",  text: "text-[#888]"    },
  cancelled: { label: "Cancelada",  bg: "bg-red-50",     text: "text-red-500"   },
  no_show:   { label: "No asistió", bg: "bg-red-50",     text: "text-red-400"   },
};

export default function AppointmentCard({
  appt, onUpdate,
}: { appt: Appointment & { owners?: any }; onUpdate: () => void }) {
  const supabase = createClient();
  const [sendingTicket, setSendingTicket] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  // Nombre/teléfono del cliente: cita genérica (cliente_nombre) o legacy (owners).
  const clienteNombre = appt.cliente_nombre || appt.owners?.name || "Cliente";
  const clienteTel = appt.cliente_telefono || appt.owners?.whatsapp || "";
  const servicio = appt.servicio || "Cita";

  const updateStatus = async (status: string) => {
    await supabase.from("appointments").update({ status } as any).eq("id", appt.id);
    onUpdate();
  };

  const sendTicket = async () => {
    setSendingTicket(true);
    try {
      // Ticket de servicio completado, vía Cloud API (ventana de 24h).
      const priceLine = appt.price ? `\n💵 Total: *$${appt.price} MXN*` : "";
      const body =
        `✨ *Servicio completado*\n\n` +
        `¡Gracias por tu visita! Tu servicio *${servicio}* quedó listo.${priceLine}\n\n` +
        `¡Te esperamos pronto!`;

      const res = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_id: appt.owner_id, phone: clienteTel, body }),
      });
      if (res.ok) {
        setTicketSent(true);
        setTimeout(() => setTicketSent(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Error al enviar (¿el cliente escribió en las últimas 24h?)");
      }
    } catch { alert("Error de conexión"); }
    finally { setSendingTicket(false); }
  };

  const st = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled;

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 16px 48px rgba(0,0,0,0.09)" }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="bg-white border border-[#EADDC8] rounded-[28px]
                 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">

        {/* ── Hora ──────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center min-w-[64px]
                        bg-[#FAEFE5] border border-orange-100
                        rounded-[18px] px-3 py-3 shrink-0">
          <p className="text-xl font-black text-[#E8542F] leading-none">
            {format(new Date(appt.scheduled_at), "HH:mm")}
          </p>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-[#8B7A6A]">
            <Clock size={9} />
            {appt.duration_min} min
          </div>
        </div>

        {/* ── Info ──────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <User size={15} className="text-[#8B7A6A] shrink-0" />
            <span className="text-base font-black text-[#241C15]">{clienteNombre}</span>
          </div>

          <p className="text-sm text-[#8B7A6A] font-medium flex items-center gap-2 flex-wrap">
            <span className="bg-teal-50 text-[#0E8C6D] font-bold text-xs
                             px-2.5 py-1 rounded-full">
              {servicio}
            </span>
          </p>

          {appt.notes && (
            <p className="text-xs text-[#8B7A6A] mt-2 italic bg-[#FBF5EC]
                           border border-[#EADDC8] rounded-[12px] px-3 py-1.5 truncate">
              "{appt.notes}"
            </p>
          )}
        </div>

        {/* ── Status + Acciones ─────────────────────── */}
        <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto
                        border-t sm:border-0 border-[#EADDC8] pt-3 sm:pt-0">
          <span className={`text-[10px] uppercase tracking-wide font-black
                            px-3 py-1.5 rounded-full self-start sm:self-end
                            ${st.bg} ${st.text}`}>
            {st.label}
          </span>

          {(appt.status === "scheduled" || appt.status === "confirmed") && (
            <div className="flex gap-2 self-start sm:self-end">
              {clienteTel && (
                <motion.a
                  whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
                  href={`https://wa.me/${clienteTel.replace(/\D/g, "")}`}
                  target="_blank"
                  className="w-9 h-9 flex items-center justify-center rounded-[14px]
                             bg-teal-50 text-[#0E8C6D]
                             hover:bg-[#0E8C6D] hover:text-white
                             border border-teal-50 transition-colors"
                  title="WhatsApp"
                >
                  <Phone size={15} />
                </motion.a>
              )}
              <motion.button
                whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
                onClick={() => updateStatus("completed")}
                className="w-9 h-9 flex items-center justify-center rounded-[14px]
                           bg-teal-50 text-[#0E8C6D]
                           hover:bg-[#0E8C6D] hover:text-white
                           border border-teal-50 transition-colors"
                title="Marcar completada"
              >
                <Check size={15} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
                onClick={() => updateStatus("no_show")}
                className="w-9 h-9 flex items-center justify-center rounded-[14px]
                           bg-red-50 text-red-400
                           hover:bg-red-500 hover:text-white
                           border border-red-50 transition-colors"
                title="No asistió"
              >
                <X size={15} />
              </motion.button>
            </div>
          )}

          {appt.status === "completed" && clienteTel && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={sendTicket}
              disabled={sendingTicket || ticketSent}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[14px] text-xs font-bold
                         bg-teal-50 text-[#0E8C6D]
                         hover:bg-[#0E8C6D] hover:text-white
                         border border-teal-50 transition-colors
                         disabled:opacity-60 self-start sm:self-end"
            >
              {sendingTicket ? <Loader2 size={13} className="animate-spin" />
               : ticketSent   ? "Ticket enviado ✓"
               : <><Send size={13} /> Enviar ticket</>}
            </motion.button>
          )}
        </div>
      </div>

      {appt.price && (
        <div className="border-t border-[#EADDC8] px-5 py-3 bg-[#FBF5EC]">
          <p className="text-xs text-[#8B7A6A] font-medium">
            Precio:{" "}
            <span className="font-black text-[#241C15]">${appt.price} MXN</span>
          </p>
        </div>
      )}
    </motion.div>
  );
}
