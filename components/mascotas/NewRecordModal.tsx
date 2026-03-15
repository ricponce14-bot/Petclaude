"use client";
import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewRecordModal({ petId }: { petId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        type: "bath",
        description: "",
        weight_kg: "",
        products: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Obtener el tenant_id activo
            const { data: { session } } = await supabase.auth.getSession();
            const tenantId = session?.user?.app_metadata?.tenant_id || session?.user?.user_metadata?.tenant_id;

            if (!tenantId) {
                throw new Error("No hay sesión activa de veterinaria.");
            }

            const { error: insertError } = await supabase.from("clinical_records").insert({
                tenant_id: tenantId,
                pet_id: petId,
                type: formData.type,
                description: formData.description,
                weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
                products: formData.products,
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
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-teal-400 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
                <Plus size={16} />
                Nuevo registro
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">Agregar al historial</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipo de consulta *</label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
                                >
                                    <option value="bath">🛁 Baño / Estética</option>
                                    <option value="vaccine">💉 Vacunación</option>
                                    <option value="checkup">🔍 Chequeo general</option>
                                    <option value="surgery">✂️ Cirugía / Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Observaciones</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Se notó irritación en la piel, se aplicó tratamiento..."
                                    rows={3}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Peso (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.weight_kg}
                                        onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                        placeholder="Ej. 12.5"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Productos / Medicinas</label>
                                    <input
                                        type="text"
                                        value={formData.products}
                                        onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                                        placeholder="Shampoo avena, etc."
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-70 shadow-sm"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Guardar en historial"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
