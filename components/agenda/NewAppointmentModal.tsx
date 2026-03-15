"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ModalShell from "@/components/ui/ModalShell";
import type { Owner, Pet } from "@/lib/supabase/types";

const schema = z.object({
  owner_id:     z.string().uuid("Selecciona un cliente"),
  pet_id:       z.string().uuid("Selecciona una mascota"),
  type:         z.enum(["bath","haircut","bath_haircut","vaccine","checkup","other"]),
  scheduled_at: z.string().min(1, "Requerido"),
  duration_min: z.coerce.number().min(15).max(480),
  price:        z.coerce.number().optional(),
  notes:        z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputCls = `w-full bg-[#FFF3E3] border border-[#F0E6D8] rounded-[16px]
  px-4 py-3 text-sm font-medium text-[#1A1A1A]
  placeholder:text-[#BBA898] outline-none
  focus:border-[#FF8C42] focus:ring-4 focus:ring-orange-100 focus:bg-white
  transition-all duration-200`;

const labelCls = "block text-xs font-bold text-[#9e8a7a] uppercase tracking-wide mb-1.5";

export default function NewAppointmentModal({
  defaultDate, onClose, onCreated,
}: { defaultDate: Date; onClose: () => void; onCreated: () => void }) {
  const supabase = createClient();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [pets, setPets]     = useState<Pet[]>([]);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      scheduled_at: format(defaultDate, "yyyy-MM-dd") + "T09:00",
      duration_min: 60,
      type: "bath",
    },
  });

  const selectedOwner = watch("owner_id");

  useEffect(() => {
    supabase.from("owners").select("id, name, whatsapp").order("name").then(({ data }) => setOwners(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedOwner) return;
    supabase.from("pets").select("id, name, breed").eq("owner_id", selectedOwner).then(({ data }) => setPets(data ?? []));
  }, [selectedOwner]);

  const onSubmit = async (values: FormData) => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const tenant_id = session?.user.app_metadata?.tenant_id || session?.user.user_metadata?.tenant_id;
    if (!tenant_id) { alert("Error de sesión"); setSaving(false); return; }

    const { error } = await supabase.from("appointments").insert({
      ...values,
      tenant_id,
      scheduled_at: new Date(values.scheduled_at).toISOString(),
    } as any);

    setSaving(false);
    if (!error) { onCreated(); onClose(); }
    else alert("Error al agendar cita: " + error.message);
  };

  return (
    <ModalShell title="Nueva cita" subtitle="Agenda una cita para tu cliente" onClose={onClose} accentColor="orange">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Cliente */}
        <div>
          <label className={labelCls}>Cliente</label>
          <select {...register("owner_id")} className={inputCls}>
            <option value="">Seleccionar cliente...</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          {errors.owner_id && <p className="text-xs text-red-500 mt-1">{errors.owner_id.message}</p>}
        </div>

        {/* Mascota */}
        <div>
          <label className={labelCls}>Mascota</label>
          <select {...register("pet_id")} className={inputCls} disabled={!selectedOwner}>
            <option value="">Seleccionar mascota...</option>
            {pets.map(p => <option key={p.id} value={p.id}>{p.name}{p.breed ? ` · ${p.breed}` : ""}</option>)}
          </select>
          {errors.pet_id && <p className="text-xs text-red-500 mt-1">{errors.pet_id.message}</p>}
        </div>

        {/* Tipo + Duración */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tipo de servicio</label>
            <select {...register("type")} className={inputCls}>
              <option value="bath">Baño</option>
              <option value="haircut">Corte</option>
              <option value="bath_haircut">Baño + Corte</option>
              <option value="vaccine">Vacuna</option>
              <option value="checkup">Revision</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Duración (min)</label>
            <input type="number" {...register("duration_min")} className={inputCls} />
          </div>
        </div>

        {/* Fecha y hora */}
        <div>
          <label className={labelCls}>Fecha y hora</label>
          <input type="datetime-local" {...register("scheduled_at")} className={inputCls} />
          {errors.scheduled_at && <p className="text-xs text-red-500 mt-1">{errors.scheduled_at.message}</p>}
        </div>

        {/* Precio + Notas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Precio (MXN)</label>
            <input type="number" {...register("price")} placeholder="Opcional" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notas</label>
            <input type="text" {...register("notes")} placeholder="Opcional" className={inputCls} />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#F0E6D8] pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2
                       bg-[#FF8C42] text-white font-bold py-3.5 rounded-[20px] text-sm
                       shadow-[0_8px_24px_rgba(255,140,66,0.30)]
                       hover:bg-[#E6722A] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Agendar cita"}
          </motion.button>
        </div>
      </form>
    </ModalShell>
  );
}
