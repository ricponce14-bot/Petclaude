"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2 } from "lucide-react";

const schema = z.object({
    name: z.string().min(2, "Mínimo 2 caracteres"),
    whatsapp: z.string().min(10, "Mínimo 10 dígitos").regex(/^\d{10,15}$/, "Solo números, 10-15 dígitos"),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditOwnerModalProps {
    owner: any;
    onClose: () => void;
    onUpdated: () => void;
}

export default function EditOwnerModal({ owner, onClose, onUpdated }: EditOwnerModalProps) {
    const supabase = createClient();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: owner.name,
            whatsapp: owner.whatsapp,
            notes: owner.notes || "",
        },
    });

    const onSubmit = async (values: FormData) => {
        setSaving(true);
        setError("");

        // Normalizar número: si son 10 dígitos, agregar 521 (código MX por defecto si no lo tiene)
        let phone = values.whatsapp.replace(/\D/g, '');
        if (phone.length === 10) phone = '521' + phone;

        const updatePayload: any = {
            name: values.name,
            whatsapp: phone,
            notes: values.notes || null,
        };

        const { error: updateErr } = await supabase
            .from("owners")
            .update(updatePayload as never)
            .eq("id", owner?.id);

        setSaving(false);

        if (updateErr) {
            setError(updateErr.message);
            return;
        }

        onUpdated();
        onClose();
    };

    const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
        <div>
            <label className="text-sm font-bold text-slate-700 mb-1.5 block">{label}</label>
            {children}
            {error && <p className="text-xs font-semibold text-red-500 mt-1.5">{error}</p>}
        </div>
    );

    const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-slate-50 focus:bg-white";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-900/10 border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
                    <h2 className="text-lg font-black text-slate-900">Editar Cliente</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white">
                    <div className="space-y-4">
                        <Field label="Nombre Completo" error={errors.name?.message}>
                            <input {...register("name")} placeholder="Ej. Lupita Hernández" className={inputCls} />
                        </Field>

                        <Field label="Número de WhatsApp" error={errors.whatsapp?.message}>
                            <input {...register("whatsapp")} placeholder="Ej. 3317001234" className={inputCls} />
                        </Field>

                        <Field label="Notas Internas (Opcional)">
                            <textarea
                                {...register("notes")}
                                rows={3}
                                placeholder="Preferencias del cliente, indicaciones especiales..."
                                className={`${inputCls} resize-none`}
                            />
                        </Field>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 px-5 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex justify-center items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-teal-500/20 disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : "Guardar Cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
