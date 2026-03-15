"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import ModalShell from "@/components/ui/ModalShell";

const inputCls = `w-full bg-[#FFF3E3] border border-[#F0E6D8] rounded-[16px]
  px-4 py-2.5 text-sm font-medium text-[#1A1A1A]
  placeholder:text-[#BBA898] outline-none
  focus:border-[#4DA18A] focus:ring-4 focus:ring-mint/20 focus:bg-white
  transition-all duration-200`;

const labelCls = "block text-xs font-bold text-[#9e8a7a] uppercase tracking-wide mb-1.5";

export default function NewRecordModal({ petId }: { petId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState<string | null>(null);
  const router   = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    type: "bath", description: "", weight_kg: "", products: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const tenantId = session?.user?.app_metadata?.tenant_id || session?.user?.user_metadata?.tenant_id;
      if (!tenantId) throw new Error("No hay sesión activa de veterinaria.");

      const { error: insertError } = await supabase.from("clinical_records").insert({
        tenant_id:   tenantId,
        pet_id:      petId,
        type:        formData.type,
        description: formData.description,
        weight_kg:   formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        products:    formData.products,
      } as any);

      if (insertError) throw insertError;
      setIsOpen(false);
      setFormData({ type: "bath", description: "", weight_kg: "", products: "" });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#4DA18A] text-white
                   px-4 py-2 rounded-[18px] text-sm font-bold
                   shadow-[0_8px_24px_rgba(155,93,229,0.25)]
                   hover:bg-[#3d8a75] transition-colors"
      >
        <Plus size={15} strokeWidth={2.5} />
        Nuevo registro
      </motion.button>

      {isOpen && (
        <ModalShell
          title="Agregar al historial"
          subtitle="Registra una consulta o tratamiento"
          onClose={() => setIsOpen(false)}
          accentColor="purple"
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm
                              font-medium rounded-[16px] px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className={labelCls}>Tipo de consulta</label>
              <select
                required
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className={inputCls}
              >
                <option value="bath">Baño / Estética</option>
                <option value="vaccine">Vacunación</option>
                <option value="checkup">Chequeo general</option>
                <option value="surgery">Cirugía / Otro</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Observaciones</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Se notó irritación en la piel, se aplicó tratamiento..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                  placeholder="Ej. 12.5"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Productos / Medicinas</label>
                <input
                  type="text"
                  value={formData.products}
                  onChange={e => setFormData({ ...formData, products: e.target.value })}
                  placeholder="Shampoo avena..."
                  className={inputCls}
                />
              </div>
            </div>

            <div className="border-t border-[#F0E6D8] pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2
                           bg-[#4DA18A] text-white font-bold py-3.5 rounded-[20px] text-sm
                           shadow-[0_8px_24px_rgba(155,93,229,0.25)]
                           hover:bg-[#3d8a75] transition-colors disabled:opacity-60"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                  : "Guardar en historial"}
              </motion.button>
            </div>
          </form>
        </ModalShell>
      )}
    </>
  );
}
