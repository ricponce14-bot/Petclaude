"use client";
// components/agenda/NewAppointmentModal.tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { X } from "lucide-react";
import type { Owner, Pet } from "@/lib/supabase/types";

const schema = z.object({
  owner_id:     z.string().uuid("Selecciona un cliente"),
  pet_id:       z.string().uuid("Selecciona una mascota"),
  type:         z.enum(["bath", "haircut", "bath_haircut", "vaccine", "checkup", "other"]),
  scheduled_at: z.string().min(1, "Requerido"),
  duration_min: z.coerce.number().min(15).max(480),
  price:        z.coerce.number().optional(),
  notes:        z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewAppointmentModal({
  defaultDate, onClose, onCreated,
}: { defaultDate: Date; onClose: () => void; onCreated: () => void }) {
  const supabase  = createClient();
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
    supabase.from("owners").select("id, name, whatsapp").order("name").then(({ data }) => {
      setOwners(data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!selectedOwner) return;
    supabase.from("pets").select("id, name, breed").eq("owner_id", selectedOwner).then(({ data }) => {
      setPets(data ?? []);
    });
  }, [selectedOwner]);

  const onSubmit = async (values: FormData) => {
    setSaving(true);
    const { error } = await supabase.from("appointments").insert({
      ...values,
      scheduled_at: new Date(values.scheduled_at).toISOString(),
    });
    setSaving(false);
    if (!error) { onCreated(); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Nueva cita</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {/* Owner */}
          <div>
            <label className="text-sm font-medium text-gray-700">Cliente</label>
            <select {...register("owner_id")} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Seleccionar...</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            {errors.owner_id && <p className="text-xs text-red-500 mt-1">{errors.owner_id.message}</p>}
          </div>

          {/* Pet */}
          <div>
            <label className="text-sm font-medium text-gray-700">Mascota</label>
            <select {...register("pet_id")} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" disabled={!selectedOwner}>
              <option value="">Seleccionar...</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name} {p.breed ? `· ${p.breed}` : ""}</option>)}
            </select>
            {errors.pet_id && <p className="text-xs text-red-500 mt-1">{errors.pet_id.message}</p>}
          </div>

          {/* Type + DateTime */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <select {...register("type")} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="bath">Baño</option>
                <option value="haircut">Corte</option>
                <option value="bath_haircut">Baño + Corte</option>
                <option value="vaccine">Vacuna</option>
                <option value="checkup">Revisión</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Duración (min)</label>
              <input type="number" {...register("duration_min")} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          {/* Date/time */}
          <div>
            <label className="text-sm font-medium text-gray-700">Fecha y hora</label>
            <input type="datetime-local" {...register("scheduled_at")} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            {errors.scheduled_at && <p className="text-xs text-red-500 mt-1">{errors.scheduled_at.message}</p>}
          </div>

          {/* Price + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Precio (MXN)</label>
              <input type="number" {...register("price")} placeholder="Opcional" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notas</label>
              <input type="text" {...register("notes")} placeholder="Opcional" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Agendar cita"}
          </button>
        </form>
      </div>
    </div>
  );
}
