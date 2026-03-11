"use client";
// components/crm/NewOwnerModal.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

const schema = z.object({
  // Owner
  owner_name: z.string().min(2, "Mínimo 2 caracteres"),
  whatsapp: z.string().regex(/^521\d{10}$/, "Formato: 521XXXXXXXXXX (13 dígitos)"),
  owner_notes: z.string().optional(),
  // Pet
  pet_name: z.string().min(1, "Requerido"),
  breed: z.string().optional(),
  birthdate: z.string().optional(),
  species: z.enum(["dog", "cat", "other"]),
  allergies: z.string().optional(),
  temperament: z.enum(["friendly", "nervous", "aggressive"]),
  pet_notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewOwnerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { species: "dog", temperament: "friendly" },
  });

  const onSubmit = async (values: FormData) => {
    setSaving(true);
    setError("");

    // 0. Obtener el tenant_id de la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    const tenant_id = session?.user.user_metadata.tenant_id;

    if (!tenant_id) {
      setError("Error de autenticación: No se encontró la veterinaria (tenant_id).");
      setSaving(false);
      return;
    }

    // 1. Crear owner
    const { data: owner, error: ownerErr } = await supabase
      .from("owners")
      .insert({
        tenant_id,
        name: values.owner_name,
        whatsapp: values.whatsapp,
        notes: values.owner_notes || null
      })
      .select()
      .single();

    if (ownerErr) { setError(ownerErr.message); setSaving(false); return; }

    // 2. Crear mascota
    const { error: petErr } = await supabase.from("pets").insert({
      tenant_id,
      owner_id: owner.id,
      name: values.pet_name,
      breed: values.breed || null,
      birthdate: values.birthdate || null,
      species: values.species,
      allergies: values.allergies || null,
      temperament: values.temperament,
      notes: values.pet_notes || null,
    });

    setSaving(false);
    if (petErr) { setError(petErr.message); return; }
    onCreated();
    onClose();
  };

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">Nuevo cliente + mascota</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {/* Owner section */}
          <div>
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">👤 Dueño</p>
            <div className="space-y-3">
              <Field label="Nombre completo" error={errors.owner_name?.message}>
                <input {...register("owner_name")} placeholder="Ej. Lupita Hernández" className={inputCls} />
              </Field>
              <Field label="WhatsApp (521XXXXXXXXXX)" error={errors.whatsapp?.message}>
                <input {...register("whatsapp")} placeholder="5213317001234" className={inputCls} />
              </Field>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Pet section */}
          <div>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">🐾 Mascota</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre" error={errors.pet_name?.message}>
                  <input {...register("pet_name")} placeholder="Ej. Frijolito" className={inputCls} />
                </Field>
                <Field label="Raza">
                  <input {...register("breed")} placeholder="Ej. Labrador" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Especie">
                  <select {...register("species")} className={inputCls}>
                    <option value="dog">Perro</option>
                    <option value="cat">Gato</option>
                    <option value="other">Otro</option>
                  </select>
                </Field>
                <Field label="Fecha de nacimiento">
                  <input type="date" {...register("birthdate")} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Temperamento">
                  <select {...register("temperament")} className={inputCls}>
                    <option value="friendly">Amigable</option>
                    <option value="nervous">Nervioso</option>
                    <option value="aggressive">Agresivo ⚠</option>
                  </select>
                </Field>
                <Field label="Alergias">
                  <input {...register("allergies")} placeholder="Ej. Látex, ciertos shampoos" className={inputCls} />
                </Field>
              </div>
              <Field label="Notas">
                <textarea {...register("pet_notes")} rows={2} placeholder="Observaciones adicionales..." className={inputCls} />
              </Field>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Registrar cliente y mascota"}
          </button>
        </form>
      </div>
    </div>
  );
}
