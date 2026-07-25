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
});
type FormData = z.infer<typeof schema>;

const inputCls = `w-full bg-[#F7ECDD] border border-[#EADDC8] rounded-[16px]
  px-4 py-2.5 text-sm font-medium text-[#241C15]
  placeholder:text-[#B3A18D] outline-none
  focus:border-[#E8542F] focus:ring-4 focus:ring-orange-100 focus:bg-white
  transition-all duration-200`;

const labelCls = "block text-xs font-bold text-[#8B7A6A] uppercase tracking-wide mb-1.5";

export default function NewOwnerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormData) => {
    setSaving(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    const tenant_id = session?.user.app_metadata?.tenant_id || session?.user.user_metadata?.tenant_id;
    if (!tenant_id) { setError("Error de sesión: no se encontró tu negocio."); setSaving(false); return; }

    let phone = values.whatsapp.replace(/\D/g, "");
    if (phone.length === 10) phone = "521" + phone;

    const { error: ownerErr } = await supabase.from("owners").insert({
      tenant_id,
      name: values.owner_name,
      whatsapp: phone,
      notes: values.owner_notes || null,
    } as any);

    setSaving(false);
    if (ownerErr) { setError(ownerErr.message); return; }
    onCreated();
    onClose();
  };

  return (
    <ModalShell
      title="Nuevo cliente"
      subtitle="Registra a tu cliente"
      onClose={onClose}
      maxWidth="max-w-lg"
      accentColor="orange"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelCls}>Nombre completo</label>
          <input {...register("owner_name")} placeholder="Ej. Laura Martínez" className={inputCls} />
          {errors.owner_name && <p className="text-xs text-red-500 mt-1">{errors.owner_name.message}</p>}
        </div>

        <div>
          <label className={labelCls}>WhatsApp</label>
          <input {...register("whatsapp")} placeholder="10 dígitos (ej. 3317001234)" className={inputCls} />
          {errors.whatsapp && <p className="text-xs text-red-500 mt-1">{errors.whatsapp.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Notas (opcional)</label>
          <input {...register("owner_notes")} placeholder="Ej. Cliente frecuente, prefiere sábados" className={inputCls} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium
                          rounded-[16px] px-4 py-3">
            {error}
          </div>
        )}

        <div className="border-t border-[#EADDC8] pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2
                       bg-[#E8542F] text-white font-bold py-3.5 rounded-[20px] text-sm
                       shadow-[0_8px_24px_rgba(232,84,47,0.30)]
                       hover:bg-[#C73E1D] transition-colors disabled:opacity-60"
          >
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
              : "Registrar cliente"}
          </motion.button>
        </div>
      </form>
    </ModalShell>
  );
}
