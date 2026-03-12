"use client";
// components/agenda/AppointmentCard.tsx
import { useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Phone, Send, Loader2 } from "lucide-react";
import type { Appointment } from "@/lib/supabase/types";

const TYPE_LABELS: Record<string, string> = {
  bath: "Baño", haircut: "Corte", bath_haircut: "Baño + Corte",
  vaccine: "Vacuna", checkup: "Revisión", other: "Otro",
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100  text-green-700",
  completed: "bg-gray-100   text-gray-500",
  cancelled: "bg-red-100    text-red-600",
  no_show: "bg-orange-100 text-orange-600",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada", confirmed: "Confirmada",
  completed: "Completada", cancelled: "Cancelada", no_show: "No asistió",
};

export default function AppointmentCard({
  appt, onUpdate,
}: { appt: Appointment & { pets?: any; owners?: any }; onUpdate: () => void }) {
  const supabase = createClient();
  const [sendingTicket, setSendingTicket] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  const updateStatus = async (status: string) => {
    // @ts-ignore: supabase auto-generated type issue with literal union
    await supabase.from("appointments").update({ status }).eq("id", appt.id);
    onUpdate();
  };

  const sendTicket = async () => {
    setSendingTicket(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const tenantId = session?.user?.app_metadata?.tenant_id || session?.user?.user_metadata?.tenant_id;

      const res = await fetch("/api/whatsapp/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appt.id, tenant_id: tenantId })
      });

      if (res.ok) {
        setTicketSent(true);
        setTimeout(() => setTicketSent(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Error al enviar ticket");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setSendingTicket(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-soft-purple hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5">
        {/* Time */}
        <div className="text-center min-w-[64px] bg-slate-50 p-3 rounded-2xl group-hover:bg-teal-50 transition-colors">
          <p className="text-xl font-black text-slate-800 leading-none">
            {format(new Date(appt.scheduled_at), "HH:mm")}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-1 border-t border-slate-100/50 pt-1">{appt.duration_min} min</p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-lg font-black text-slate-900">{appt.pets?.name}</span>
            {appt.pets?.allergies && (
              <span className="text-[10px] uppercase font-bold tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                Alergias
              </span>
            )}
            {appt.pets?.temperament === "aggressive" && (
              <span className="text-[10px] uppercase font-bold tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full shadow-sm">Agresivo</span>
            )}
            {appt.pets?.temperament === "nervous" && (
              <span className="text-[10px] uppercase font-bold tracking-wider bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full shadow-sm">Nervioso</span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium">
            <span className="text-teal-600 font-bold bg-teal-50 px-2.5 py-0.5 rounded-md inline-block mb-1 sm:inline sm:mb-0 mr-2">{TYPE_LABELS[appt.type]}</span>
            {appt.owners?.name}
          </p>
          {appt.notes && <p className="text-xs text-slate-400 mt-2 truncate bg-slate-50 p-2 rounded-lg italic">"{appt.notes}"</p>}
        </div>

        {/* Status + Actions */}
        <div className="flex flex-col sm:items-end gap-3 mt-4 sm:mt-0 w-full sm:w-auto border-t sm:border-0 border-slate-100 pt-4 sm:pt-0">
          <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-black self-start sm:self-end shadow-sm ${STATUS_STYLES[appt.status]}`}>
            {STATUS_LABELS[appt.status]}
          </span>

          {(appt.status === "scheduled" || appt.status === "confirmed") && (
            <div className="flex gap-2 self-start sm:self-end">
              <a
                href={`https://wa.me/${appt.owners?.whatsapp}`}
                target="_blank"
                className="p-2.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                title="WhatsApp"
              >
                <Phone size={16} />
              </a>
              <button
                onClick={() => updateStatus("completed")}
                className="p-2.5 bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                title="Marcar completada"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => updateStatus("no_show")}
                className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                title="No asistió"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Botón de ticket para citas completadas */}
          {appt.status === "completed" && (
            <button
              onClick={sendTicket}
              disabled={sendingTicket || ticketSent}
              className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-60 self-start sm:self-end"
            >
              {sendingTicket ? (
                <Loader2 size={14} className="animate-spin" />
              ) : ticketSent ? (
                <>Ticket enviado</>
              ) : (
                <>
                  <Send size={14} /> Enviar ticket por WA
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {appt.price && (
        <div className="border-t border-slate-100/50 px-5 py-3 bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">Precio total: <span className="font-bold text-slate-800 ml-1">${appt.price} MXN</span></p>
        </div>
      )}
    </div>
  );
}
