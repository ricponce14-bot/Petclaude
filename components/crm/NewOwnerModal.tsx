"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ModalShell from "@/components/ui/ModalShell";

const schema = z.object({
  owner_name:   z.string().min(2, "Mínimo 2 caracteres"),
  whatsapp:     z.string().min(10, "Mínimo 10 dígitos").regex(/^\d{10,15}$/, "Solo números, 10-15 dígitos"),
  owner_notes:  z.string().optional(),
  pet_name:     z.string().min(1, "Requerido"),
  breed:        z.string().optional(),
  birthdate:    z.string().optional(),
  species:      z.enum(["dog","cat","other"]),
  allergies:    z.string().optional(),
  temperament:  z.enum(["friendly","nervous","aggressive"]),
  pet_notes:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputCls = `w-full bg-[#FFF3E3] border border-[#F0E6D8] rounded-[16px]
  px-4 py-2.5 text-sm font-medium text-[#1A1A1A]
  placeholder:text-[#BBA898] outline-none
  focus:border-[#FF8C42] focus:ring-4 focus:ring-orange-100 focus:bg-white
  transition-all duration-200`;

const labelCls = "block text-xs font-bold text-[#9e8a7a] uppercase tracking-wide mb-1.5";

const SectionTitle = ({ emoji, label, color }: { emoji: string; label: string; color: string }) => (
  <div className={`flex items-center gap-2 mb-3 pb-2 border-b border-[#F0E6D8]`}>
    <span className="text-base">{emoji}</span>
    <p className={`text-xs font-black uppercase tracking-widest ${color}`}>{label}</p>
  </div>
);

export default function NewOwnerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { species: "dog", temperament: "friendly" },
  });

  const onSubmit = async (values: FormData) => {
    setSaving(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    const tenant_id = session?.user.app_metadata?.tenant_id || session?.user.user_metadata?.tenant_id;
    if (!tenant_id) { setError("Error de autenticación: No se encontró la veterinaria."); setSaving(false); return; }

    let phone = values.whatsapp.replace(/\D/g, "");
    if (phone.length === 10) phone = "521" + phone;

    const { data: owner, error: ownerErr } = await supabase
      .from("owners")
      .insert({ tenant_id, name: values.owner_name, whatsapp: phone, notes: values.owner_notes || null } as any)
      .select().single();

    if (ownerErr) { setError(ownerErr.message); setSaving(false); return; }

    if ((owner as any)?.id) {
      const { error: petErr } = await supabase.from("pets").insert({
        tenant_id,
        owner_id: (owner as any).id,
        name: values.pet_name,
        breed: values.breed || null,
        birthdate: values.birthdate || null,
        species: values.species,
        allergies: values.allergies || null,
        temperament: values.temperament,
        notes: values.pet_notes || null,
      } as never);
      if (petErr) { setError(petErr.message); setSaving(false); return; }
    }

    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <ModalShell
      title="Nuevo cliente"
      subtitle="Registra el dueño y su mascota"
      onClose={onClose}
      maxWidth="max-w-lg"
      accentColor="orange"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Dueño ─────────────────────────────────── */}
        <div>
          <SectionTitle emoji="👤" label="Dueño" color="text-[#FF8C42]" />
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Nombre completo</label>
              <input {...register("owner_name")} placeholder="Ej. Lupita Hernández" className={inputCls} />
              {errors.owner_name && <p className="text-xs text-red-500 mt-1">{errors.owner_name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input {...register("whatsapp")} placeholder="3317001234" className={inputCls} />
              {errors.whatsapp && <p className="text-xs text-red-500 mt-1">{errors.whatsapp.message}</p>}
            </div>
          </div>
        </div>

        {/* ── Mascota ───────────────────────────────── */}
        <div>
          <SectionTitle emoji="🐾" label="Mascota" color="text-[#9B5DE5]" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nombre</label>
                <input {...register("pet_name")} placeholder="Ej. Frijolito" className={inputCls} />
                {errors.pet_name && <p className="text-xs text-red-500 mt-1">{errors.pet_name.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Raza</label>
                <input {...register("breed")} placeholder="Ej. Labrador" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Especie</label>
                <select {...register("species")} className={inputCls}>
                  <option value="dog">🐕 Perro</option>
                  <option value="cat">🐈 Gato</option>
                  <option value="other">🐾 Otro</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Temperamento</label>
                <select {...register("temperament")} className={inputCls}>
                  <option value="friendly">😊 Amigable</option>
                  <option value="nervous">😰 Nervioso</option>
                  <option value="aggressive">😤 Agresivo</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha de nacimiento</label>
                <input type="date" {...register("birthdate")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Alergias</label>
                <input {...register("allergies")} placeholder="Ej. Látex" className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium
                          rounded-[16px] px-4 py-3">
            {error}
          </div>
        )}

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
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
              : "Registrar cliente y mascota"}
          </motion.button>
        </div>
      </form>
    </ModalShell>
  );
}
