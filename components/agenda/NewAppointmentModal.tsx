"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ModalShell from "@/components/ui/ModalShell";
import type { Owner, BotService } from "@/lib/supabase/types";

const inputCls = `w-full bg-[#F7ECDD] border border-[#EADDC8] rounded-[16px]
  px-4 py-3 text-sm font-medium text-[#241C15]
  placeholder:text-[#B3A18D] outline-none
  focus:border-[#E8542F] focus:ring-4 focus:ring-orange-100 focus:bg-white
  transition-all duration-200`;

const labelCls = "block text-xs font-bold text-[#8B7A6A] uppercase tracking-wide mb-1.5";

export default function NewAppointmentModal({
  defaultDate, onClose, onCreated,
}: { defaultDate: Date; onClose: () => void; onCreated: () => void }) {
  const supabase = createClient();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [services, setServices] = useState<BotService[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Estado del formulario
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [ownerId, setOwnerId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [servicioMode, setServicioMode] = useState<"catalog" | "custom">("catalog");
  const [servicio, setServicio] = useState("");
  const [scheduledAt, setScheduledAt] = useState(format(defaultDate, "yyyy-MM-dd") + "T09:00");
  const [durationMin, setDurationMin] = useState(60);
  const [price, setPrice] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase.from("owners").select("id, name, whatsapp").order("name").then(({ data }) => {
      setOwners(data ?? []);
      if (!data || data.length === 0) setClientMode("new");
    });
    // Catálogo de servicios configurable del negocio (bot_config.services)
    supabase.from("bot_config").select("services").maybeSingle().then(({ data }) => {
      const raw = (data as any)?.services;
      const parsed: BotService[] = typeof raw === "string" ? JSON.parse(raw || "[]") : (raw ?? []);
      setServices(Array.isArray(parsed) ? parsed : []);
      if (!parsed || parsed.length === 0) setServicioMode("custom");
    });
  }, []);

  const pickService = (label: string) => {
    setServicio(label);
    const svc = services.find((s) => s.label === label);
    if (svc) {
      if (svc.duration_min) setDurationMin(svc.duration_min);
      if (svc.price != null) setPrice(String(svc.price));
    }
  };

  const submit = async () => {
    setError("");
    // Validaciones
    if (clientMode === "existing" && !ownerId) return setError("Selecciona un cliente.");
    if (clientMode === "new" && !clienteNombre.trim()) return setError("Escribe el nombre del cliente.");
    if (!servicio.trim()) return setError("Indica el servicio.");
    if (!scheduledAt) return setError("Indica fecha y hora.");

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const tenant_id = session?.user.app_metadata?.tenant_id || session?.user.user_metadata?.tenant_id;
    if (!tenant_id) { setError("Error de sesión"); setSaving(false); return; }

    // Resolver nombre/teléfono del cliente
    let nombre = clienteNombre.trim();
    let telefono = clienteTelefono.trim();
    let owner_id: string | null = null;
    if (clientMode === "existing") {
      const o = owners.find((x) => x.id === ownerId);
      owner_id = ownerId;
      nombre = o?.name ?? nombre;
      telefono = o?.whatsapp ?? telefono;
    }

    const { error: insErr } = await supabase.from("appointments").insert({
      tenant_id,
      owner_id,
      cliente_nombre: nombre,
      cliente_telefono: telefono || null,
      servicio: servicio.trim(),
      type: "other",
      status: "scheduled",
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_min: durationMin,
      price: price ? Number(price) : null,
      notes: notes.trim() || null,
    } as any);

    setSaving(false);
    if (!insErr) { onCreated(); onClose(); }
    else setError("Error al agendar: " + insErr.message);
  };

  return (
    <ModalShell title="Nueva cita" subtitle="Agenda una cita para tu cliente" onClose={onClose} accentColor="orange">
      <div className="space-y-4">

        {/* Cliente: existente o nuevo */}
        <div>
          <label className={labelCls}>Cliente</label>
          <div className="flex gap-2 mb-2">
            {owners.length > 0 && (
              <button type="button" onClick={() => setClientMode("existing")}
                className={`flex-1 py-2 rounded-[14px] text-xs font-bold transition-colors
                  ${clientMode === "existing" ? "bg-[#E8542F] text-white" : "bg-[#F7ECDD] text-[#8B7A6A]"}`}>
                Cliente existente
              </button>
            )}
            <button type="button" onClick={() => setClientMode("new")}
              className={`flex-1 py-2 rounded-[14px] text-xs font-bold transition-colors
                ${clientMode === "new" ? "bg-[#E8542F] text-white" : "bg-[#F7ECDD] text-[#8B7A6A]"}`}>
              Cliente nuevo
            </button>
          </div>

          {clientMode === "existing" ? (
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputCls}>
              <option value="">Seleccionar cliente...</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <input type="text" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Nombre del cliente" className={inputCls} />
              <input type="tel" value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder="WhatsApp (521...) — opcional" className={inputCls} />
            </div>
          )}
        </div>

        {/* Servicio */}
        <div>
          <label className={labelCls}>Servicio</label>
          {services.length > 0 && (
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setServicioMode("catalog")}
                className={`flex-1 py-2 rounded-[14px] text-xs font-bold transition-colors
                  ${servicioMode === "catalog" ? "bg-[#0E8C6D] text-white" : "bg-[#F7ECDD] text-[#8B7A6A]"}`}>
                Del catálogo
              </button>
              <button type="button" onClick={() => { setServicioMode("custom"); setServicio(""); }}
                className={`flex-1 py-2 rounded-[14px] text-xs font-bold transition-colors
                  ${servicioMode === "custom" ? "bg-[#0E8C6D] text-white" : "bg-[#F7ECDD] text-[#8B7A6A]"}`}>
                Otro
              </button>
            </div>
          )}
          {servicioMode === "catalog" && services.length > 0 ? (
            <select value={servicio} onChange={(e) => pickService(e.target.value)} className={inputCls}>
              <option value="">Seleccionar servicio...</option>
              {services.map((s) => (
                <option key={s.key || s.label} value={s.label}>
                  {s.label}{s.price != null ? ` · $${s.price}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input type="text" value={servicio} onChange={(e) => setServicio(e.target.value)}
              placeholder="Ej. Corte de cabello, Masaje, Consulta..." className={inputCls} />
          )}
          {services.length === 0 && (
            <p className="text-[11px] text-[#B3A18D] mt-1.5">
              Tip: define tus servicios en <span className="font-bold">Bot Automático</span> para elegirlos rápido.
            </p>
          )}
        </div>

        {/* Fecha/hora + Duración */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Fecha y hora</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Duración (min)</label>
            <input type="number" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className={inputCls} />
          </div>
        </div>

        {/* Precio + Notas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Precio (MXN)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Opcional" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notas</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className={inputCls} />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <div className="border-t border-[#EADDC8] pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            type="button" onClick={submit} disabled={saving}
            className="w-full flex items-center justify-center gap-2
                       bg-[#E8542F] text-white font-bold py-3.5 rounded-[20px] text-sm
                       shadow-[0_8px_24px_rgba(232,84,47,0.30)]
                       hover:bg-[#C73E1D] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Agendar cita"}
          </motion.button>
        </div>
      </div>
    </ModalShell>
  );
}
